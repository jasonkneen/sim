'use client'

import type { FunctionComponent } from 'react'
import { AIChatContent } from './ai-chat-content'
import { AudioPlayerContent } from './audio-player-content'
import { AudioRecorderContent } from './audio-recorder-content'
import { FileBlockContent } from './file-block-content'
import { FolderBlockContent } from './folder-block-content'
import { MediaViewerContent } from './media-viewer-content'
import { SmartNodeContent } from './smart-node-content'
import type { CustomBlockContentProps } from './types'

const registry: Record<string, FunctionComponent<CustomBlockContentProps>> = {
  media_viewer: MediaViewerContent,
  file: FileBlockContent,
  folder: FolderBlockContent,
  agent: AIChatContent,
  smart: SmartNodeContent,
  audio_player: AudioPlayerContent,
  audio_recorder: AudioRecorderContent,
}

interface Props extends CustomBlockContentProps {
  type: string
}

export function CustomBlockContent({ type, ...props }: Props) {
  const Component = registry[type]
  if (!Component) return null
  return <Component {...props} />
}

export type { CustomBlockContentProps }
