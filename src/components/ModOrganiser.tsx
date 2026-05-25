import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useModProject } from '../context/ModProjectContext';
import { ELEMENT_SCHEMAS } from '../lib/schemas';
import { motion } from 'motion/react';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

export function ModOrganiser() {
  const { state, dispatch } = useModProject();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [viewMode, setViewMode] = useState<'graph' | 'tree'>('graph');

  useEffect(() => {
    if (!containerRef.current || viewMode !== 'graph') return;
    
    const observeTarget = containerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(observeTarget);
    return () => resizeObserver.disconnect();
  }, [viewMode]);

  useEffect(() => {
    if (!svgRef.current || state.elements.length === 0 || viewMode !== 'graph') return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Prepare data
    const nodes: Node[] = state.elements.map(el => {
      const schema = ELEMENT_SCHEMAS[el.type];
      return {
        id: el.id,
        name: el.data.display_name || el.data.buff_name || el.data.name || 'Untitled',
        type: el.type,
        icon: schema?.icon || '🧩',
        color: el.type === 'Trait' ? '#FFBB00' : 
               el.type === 'Buff' ? '#00A3FF' : 
               el.type === 'Career' ? '#4CAF50' : 
               '#94a3b8',
      };
    });

    const links: Link[] = [];
    state.elements.forEach(el => {
      // Very basic connection detection based on field values that match IDs
      Object.values(el.data).forEach(val => {
        if (typeof val === 'string' && val.includes('_') && state.elements.some(e => e.id === val)) {
          links.push({ source: el.id, target: val });
        } else if (Array.isArray(val)) {
          val.forEach(item => {
            if (typeof item === 'string' && state.elements.some(e => e.id === item)) {
              links.push({ source: el.id, target: item });
            }
          });
        }
      });
    });

    const g = svg.append("g");

    // Add zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    // Links
    const link = g.append("g")
      .attr("stroke", "#db2777")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 3)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("marker-end", "url(#arrowhead)");

    // Arrowhead definition
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 35)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#db2777")
      .style("stroke", "none");

    // Nodes
    const node = g.append("g")
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => {
        dispatch({ type: 'SELECT_ELEMENT', payload: d.id });
      });

    // Node Background
    node.append("rect")
      .attr("width", 140)
      .attr("height", 50)
      .attr("x", -70)
      .attr("y", -25)
      .attr("rx", 12)
      .attr("fill", "white")
      .attr("stroke", d => d.color)
      .attr("stroke-width", 2)
      .attr("class", "shadow-sm cursor-pointer hover:shadow-md transition-shadow uppercase");

    // Icon Container
    node.append("circle")
      .attr("r", 16)
      .attr("cx", -48)
      .attr("cy", 0)
      .attr("fill", d => `${d.color}20`)
      .attr("stroke", d => d.color)
      .attr("stroke-width", 1)
      .attr("class", "cursor-pointer");

    // Icons (Handle both emojis and image paths)
    node.each(function(d) {
      const el = d3.select(this);
      if (d.icon && (d.icon.startsWith('/') || d.icon.includes('.'))) {
        el.append("image")
          .attr("xlink:href", d.icon)
          .attr("x", -60)
          .attr("y", -12)
          .attr("width", 24)
          .attr("height", 24)
          .attr("class", "cursor-pointer");
      } else {
        el.append("text")
          .attr("x", -48)
          .attr("y", 6)
          .attr("text-anchor", "middle")
          .attr("font-size", "16px")
          .text(d.icon || '🧩')
          .attr("class", "cursor-pointer");
      }
    });

    // Name
    node.append("text")
      .attr("x", -25)
      .attr("y", -3)
      .attr("font-size", "12px")
      .attr("font-weight", "900")
      .attr("fill", "#1e293b")
      .attr("class", "uppercase tracking-tight cursor-pointer")
      .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name);

    // Type Label
    node.append("text")
      .attr("x", -25)
      .attr("y", 10)
      .attr("font-size", "9px")
      .attr("font-weight", "bold")
      .attr("fill", "#64748b")
      .attr("class", "uppercase tracking-[0.2em] opacity-60 cursor-pointer")
      .text(d => d.type);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      // Sticky nodes: we keep fx and fy so the node stays where it was dropped
    }

  // Expose reset function via a ref or window for simplicity in this visualization
    (window as any).resetModLayout = () => {
      nodes.forEach(n => {
        n.fx = null;
        n.fy = null;
      });
      simulation.alpha(1).restart();
    };

  }, [dimensions, state.elements, dispatch, viewMode]);

  // Helper to build hierarchy
  const getHierarchy = () => {
    const roots = state.elements.filter(el => {
      // It's a root if nothing else points to its ID
      return !state.elements.some(other => 
        Object.values(other.data).some(val => 
          val === el.id || (Array.isArray(val) && val.includes(el.id))
        )
      );
    });

    const getChildren = (parentId: string) => {
      const parent = state.elements.find(e => e.id === parentId);
      if (!parent) return [];
      
      return state.elements.filter(el => {
        return Object.values(parent.data).some(val => 
          val === el.id || (Array.isArray(val) && val.includes(el.id))
        );
      });
    };

    return roots.map(root => ({
      ...root,
      children: getChildren(root.id)
    }));
  };

  const renderIcon = (type: string, className: string = "w-5 h-5") => {
    const icon = ELEMENT_SCHEMAS[type]?.icon || '🧩';
    if (icon.startsWith('/') || icon.includes('.')) {
      return <img src={icon} className={`${className} object-contain`} alt="" />;
    }
    return <span className="text-lg">{icon}</span>;
  };

  const hierarchy = getHierarchy();

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-[var(--color-tertiary)] uppercase tracking-tight">Mod Organiser</h2>
          <p className="text-lg opacity-60 font-medium italic">Visualization of how your mod elements connect.</p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* View Toggler */}
          <div className="flex p-1 bg-slate-100 rounded-2xl border-2 border-slate-200">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'graph' ? 'bg-white shadow-md text-[var(--color-tertiary)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Visualisation
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'tree' ? 'bg-white shadow-md text-[var(--color-tertiary)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Interaction Flow
            </button>
          </div>

          <div className="h-8 w-[2px] bg-slate-200" />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border-2 border-[var(--color-border-light)] shadow-sm">
               <div className="flex items-center gap-2 px-3 border-r">
                 <div className="w-2 h-2 rounded-full bg-[#FFBB00]" />
                 <span className="text-xs font-black uppercase opacity-60">Trait</span>
               </div>
               <div className="flex items-center gap-2 px-3 border-r">
                 <div className="w-2 h-2 rounded-full bg-[#00A3FF]" />
                 <span className="text-xs font-black uppercase opacity-60">Buff</span>
               </div>
               <div className="flex items-center gap-2 px-3">
                 <div className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                 <span className="text-xs font-black uppercase opacity-60">Career</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          {viewMode === 'tree' ? (
            <div className="w-full h-full bg-white rounded-[3rem] border-4 border-[var(--color-border-light)] p-12 overflow-y-auto custom-scrollbar shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hierarchy.length === 0 ? (
                  <div className="col-span-full text-center py-20 opacity-30 italic text-xl">No connections found</div>
                ) : (
                  hierarchy.map(root => (
                    <div key={root.id} className="space-y-6">
                      <div 
                        onClick={() => dispatch({ type: 'SELECT_ELEMENT', payload: root.id })}
                        className="p-6 bg-slate-50 rounded-[2.5rem] border-4 border-slate-200 cursor-pointer hover:border-[#db2777]/30 hover:bg-[#db2777]/5 transition-all group shadow-sm hover:shadow-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center border-2 border-slate-100 group-hover:scale-110 transition-transform">
                            {renderIcon(root.type, "w-8 h-8")}
                          </div>
                          <div>
                            <div className="text-xs font-black uppercase text-slate-400 leading-none mb-1 tracking-widest">{root.type}</div>
                            <div className="text-sm font-black uppercase text-slate-700 truncate w-40">
                              {root.data.display_name || root.data.buff_name || root.data.name || 'Untitled'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {root.children.length > 0 && (
                        <div className="pl-8 border-l-4 border-slate-100 ml-8 space-y-6 relative">
                          {root.children.map(child => (
                            <div key={child.id} className="relative">
                              <div className="absolute -left-8 top-1/2 w-6 h-[4px] bg-slate-100" />
                              <div 
                                onClick={() => dispatch({ type: 'SELECT_ELEMENT', payload: child.id })}
                                className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm cursor-pointer hover:shadow-xl hover:border-[#db2777]/20 transition-all hover:-translate-y-1"
                              >
                                <div className="flex items-center gap-3">
                                  {renderIcon(child.type, "w-6 h-6")}
                                  <div className="text-xs font-black uppercase text-slate-600 truncate w-32">
                                    {child.data.display_name || child.data.buff_name || child.data.name || 'Untitled'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="w-full h-full bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-[var(--color-border-light)] relative overflow-hidden group shadow-inner"
            >
              {state.elements.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 space-y-4">
                   <div className="text-6xl grayscale opacity-20">🐝</div>
                   <p className="text-xl font-black uppercase tracking-widest opacity-20">Add elements to see the diagram</p>
                </div>
              ) : (
                <svg 
                  ref={svgRef} 
                  width={dimensions.width} 
                  height={dimensions.height}
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                />
              )}
              
              <div className="absolute bottom-8 left-8 flex gap-4">
                <div className="px-5 py-3 bg-white/90 backdrop-blur rounded-2xl border-2 border-slate-100 text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#db2777] animate-pulse" />
                  Visual System Active
                </div>
                <div className="px-5 py-3 bg-white/80 backdrop-blur rounded-2xl border border-slate-100 text-[11px] font-black uppercase tracking-widest opacity-60">
                  Drag to move • Scroll to zoom • Click to edit
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
