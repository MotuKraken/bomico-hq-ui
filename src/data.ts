import type { NavNode, TechniqueVideo } from './types'

export const navigationTree: NavNode[] = [
  {
    id: 'combat-system',
    label: 'Combat System',
    children: [
      {
        id: 'grappling',
        label: 'Grappling',
        children: [
          {
            id: 'nogi-bjj',
            label: 'No-Gi BJJ',
            children: [
              { id: 'attacks', label: 'Attacks' },
              { id: 'defenses', label: 'Defenses' },
              { id: 'takedowns', label: 'Takedowns' },
              { id: 'positions', label: 'Positions' },
              { id: 'transitions', label: 'Transitions' },
              { id: 'submissions', label: 'Submissions' },
            ],
          },
          { id: 'gi-bjj', label: 'Gi BJJ' },
          { id: 'mma', label: 'MMA' },
          { id: 'boxing', label: 'Boxing' },
          { id: 'muay-thai', label: 'Muay Thai' },
          { id: 'self-defense', label: 'Self-Defense' },
        ],
      },
    ],
  },
  { id: 'fitness', label: 'Fitness' },
  { id: 'body-control', label: 'Body Control' },
  { id: 'mind-control', label: 'Mind Control' },
]

export const tagFilters = [
  'Mount',
  'Attack',
  'Defense',
  'Submission',
  'Arm Lock',
  'Armbar',
  'Transitions',
  'Counters',
]

export const techniqueVideos: TechniqueVideo[] = [
  {
    id: 'armbar-mount',
    title: 'Armbar aus der Mount',
    subtitle: 'Fundamentals',
    heroImage:
      'https://images.pexels.com/photos/4761799/pexels-photo-4761799.jpeg?auto=compress&cs=tinysrgb&w=1200',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    filename: 'videos/NoGi/Armbar_aus_Mount.mp4',
    internalPath: '/data/videos/combat-system/nogi/mount/armbar_fundamentals.mp4',
    sourceUrl: 'https://youtube.com/watch?v=ABCDE1234',
    breadcrumbs: [
      'Combat System',
      'No-Gi BJJ',
      'Mount',
      'Attacks',
      'Submissions',
      'Arm Locks',
      'Armbar',
    ],
    tags: [
      'Combat System',
      'No-Gi BJJ',
      'MMA',
      'Gi BJJ',
      'Mount',
      'Attack',
      'Submission',
      'Arm Lock',
      'Armbar',
      'Fundamentals',
    ],
    focusTags: ['Mount', 'Attack', 'Arm Lock', 'Armbar'],
    techniqueStart: '01:23',
    techniqueEnd: '02:10',
    segments: [
      { id: 'intro', label: 'Context & Objectives', start: '00:00', end: '00:28' },
      { id: 'setup', label: 'S-Mount Setup', start: '00:29', end: '01:12' },
      { id: 'entry', label: 'Armbar Entry', start: '01:13', end: '01:52' },
      { id: 'finish', label: 'Finish Mechanics', start: '01:53', end: '02:34' },
      { id: 'troubleshooting', label: 'Counters & Adjustments', start: '02:35', end: '03:18' },
      { id: 'variations', label: 'Follow-up Options', start: '03:19', end: '04:00' },
    ],
    assets: {
      transcriptPath: '/transcripts/armbar_mount_fundamentals.md',
      transcriptUrl: 'https://files.bomiko.ro/transcripts/armbar_mount_fundamentals.md',
      posePath: '/pose_extraction/armbar_mount_fundamentals.json',
      stickFigurePath: '/animations/pose/armbar_mount_fundamentals.mp4',
      graphRef: '/graph/nodes/armbar_mount.json',
    },
    knowledgeGraph: {
      nodes: [
        { id: 'mount', label: 'Mount Control', type: 'position' },
        { id: 'arm-isolation', label: 'Arm Isolation', type: 'technique' },
        { id: 'armbar', label: 'Armbar Finish', type: 'technique' },
        { id: 'defense', label: 'Armbar Defense', type: 'reaction' },
        { id: 'counter', label: 'Counter to Defense', type: 'followUp' },
      ],
      edges: [
        { from: 'mount', to: 'arm-isolation', label: 'setup' },
        { from: 'arm-isolation', to: 'armbar', label: 'enter' },
        { from: 'armbar', to: 'defense', label: 'common reaction' },
        { from: 'defense', to: 'counter', label: 'counter' },
      ],
    },
    related: [
      {
        id: 'armbar-counters',
        title: 'Counters to the Mounted Armbar',
        relation: 'counter',
        thumbnail:
          'https://images.pexels.com/photos/4761811/pexels-photo-4761811.jpeg?auto=compress&cs=tinysrgb&w=640',
      },
      {
        id: 'armbar-defenses',
        title: 'Defenses vs. Mounted Armbar',
        relation: 'defense',
        thumbnail:
          'https://images.pexels.com/photos/4761786/pexels-photo-4761786.jpeg?auto=compress&cs=tinysrgb&w=640',
      },
      {
        id: 'armbar-followup',
        title: 'Follow-up: Mounted Triangle',
        relation: 'followUp',
        thumbnail:
          'https://images.pexels.com/photos/4761813/pexels-photo-4761813.jpeg?auto=compress&cs=tinysrgb&w=640',
      },
      {
        id: 's-mount-flow',
        title: 'S-Mount Attack Flow',
        relation: 'variation',
        thumbnail:
          'https://images.pexels.com/photos/4761797/pexels-photo-4761797.jpeg?auto=compress&cs=tinysrgb&w=640',
      },
    ],
  },
]
