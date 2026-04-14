import { useState } from 'react'
import type { NavNode } from '../types'
import './SidebarExplorer.css'

interface SidebarExplorerProps {
  nodes: NavNode[]
  activePath: string[]
  onSelect: (path: string[]) => void
}

export function SidebarExplorer({ nodes, activePath, onSelect }: SidebarExplorerProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Domains</div>
      <nav>
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            activePath={activePath}
            path={[]}
            onSelect={onSelect}
          />
        ))}
      </nav>
    </aside>
  )
}

interface TreeNodeProps {
  node: NavNode
  depth: number
  activePath: string[]
  path: string[]
  onSelect: (path: string[]) => void
}

function TreeNode({ node, depth, activePath, path, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2)
  const currentPath = [...path, node.label]
  const isActive = activePath.join('>') === currentPath.join('>')
  const isAncestor = activePath.join('>').startsWith(currentPath.join('>'))

  return (
    <div className="tree-node" data-depth={depth}>
      <button
        className={`node-label ${isActive ? 'active' : ''} ${isAncestor ? 'ancestor' : ''}`}
        onClick={() => {
          onSelect(currentPath)
          if (node.children?.length) {
            setExpanded(true)
          }
        }}
      >
        {node.children && (
          <span
            className={`caret ${expanded ? 'open' : ''}`}
            onClick={(event) => {
              event.stopPropagation()
              setExpanded((prev) => !prev)
            }}
          ></span>
        )}
        {node.label}
      </button>
      {node.children && expanded && (
        <div className="node-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              path={currentPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
