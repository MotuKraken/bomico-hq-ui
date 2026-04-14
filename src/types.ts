export interface NavNode {
  id: string
  label: string
  icon?: string
  children?: NavNode[]
}

export interface VideoSegment {
  id: string
  label: string
  start: string
  end: string
}

export interface AssetLinks {
  transcriptPath: string
  posePath: string
  stickFigurePath: string
  graphRef: string
  transcriptUrl?: string
}

export interface KnowledgeGraphNode {
  id: string
  label: string
  type: 'position' | 'technique' | 'reaction' | 'followUp'
}

export interface KnowledgeGraphEdge {
  from: string
  to: string
  label?: string
}

export interface RelatedTechniqueItem {
  id: string
  title: string
  relation: 'counter' | 'defense' | 'followUp' | 'variation'
  description?: string
  thumbnail?: string
}

export interface TechniqueVideo {
  id: string
  title: string
  subtitle: string
  heroImage: string
  videoUrl: string
  filename: string
  internalPath: string
  sourceUrl: string
  breadcrumbs: string[]
  tags: string[]
  focusTags: string[]
  segments: VideoSegment[]
  techniqueStart: string
  techniqueEnd: string
  assets: AssetLinks
  knowledgeGraph: {
    nodes: KnowledgeGraphNode[]
    edges: KnowledgeGraphEdge[]
  }
  related: RelatedTechniqueItem[]
}
