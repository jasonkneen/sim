import { AtomIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

type ThreeDAsset = {
  url: string
  name?: string
  format?: 'glb' | 'gltf' | 'obj' | 'fbx'
}

type ThreeDSceneConfig = {
  backgroundColor?: string
  enableOrbitControls?: boolean
  autoRotate?: boolean
  lightingPreset?: 'studio' | 'sunset' | 'night'
}

interface ThreeDToolResponse extends ToolResponse {
  output: {
    asset: ThreeDAsset
    scene: ThreeDSceneConfig
    cameraPosition?: { x: number; y: number; z: number }
  }
}

export const ThreeDBlock: BlockConfig<ThreeDToolResponse> = {
  type: 'three_d',
  name: '3D Viewer',
  description: 'Render and manipulate 3D assets.',
  longDescription:
    'Load 3D assets, configure lighting and camera controls, and stream scene data to downstream blocks for further processing.',
  category: 'blocks',
  bgColor: '#4834D4',
  icon: AtomIcon,
  subBlocks: [
    {
      id: 'assetUrl',
      title: 'Asset URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://cdn.example.com/model.glb',
      required: true,
    },
    {
      id: 'assetFormat',
      title: 'Asset Format',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'GLB', id: 'glb' },
        { label: 'GLTF', id: 'gltf' },
        { label: 'OBJ', id: 'obj' },
        { label: 'FBX', id: 'fbx' },
      ],
      value: () => 'glb',
    },
    {
      id: 'backgroundColor',
      title: 'Background Color',
      type: 'short-input',
      layout: 'half',
      placeholder: '#000000',
    },
    {
      id: 'lightingPreset',
      title: 'Lighting Preset',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Studio', id: 'studio' },
        { label: 'Sunset', id: 'sunset' },
        { label: 'Night', id: 'night' },
      ],
      value: () => 'studio',
    },
    {
      id: 'enableOrbitControls',
      title: 'Enable orbit controls',
      type: 'switch',
      layout: 'half',
      description: 'Allow users to orbit the camera around the model.',
    },
    {
      id: 'autoRotate',
      title: 'Auto rotate model',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'cameraPosition',
      title: 'Camera Position (x,y,z)',
      type: 'short-input',
      layout: 'full',
      placeholder: '0, 1.5, 3',
      description: 'Optional initial camera position.',
    },
  ],
  tools: { access: [] },
  inputs: {
    assetUrl: { type: 'string', description: 'URL to the 3D asset' },
    assetFormat: { type: 'string', description: 'Asset file format' },
    backgroundColor: { type: 'string', description: 'Scene background colour' },
    lightingPreset: { type: 'string', description: 'Lighting preset' },
    enableOrbitControls: { type: 'boolean', description: 'Enable orbit controls' },
    autoRotate: { type: 'boolean', description: 'Auto rotate the model' },
    cameraPosition: { type: 'string', description: 'Initial camera coordinates' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the 3D operation was successful' },
    output: { type: 'json', description: 'The structured output containing 3D data' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    asset: { type: 'json', description: '3D asset details' },
    scene: { type: 'json', description: 'Scene configuration' },
    cameraPosition: { type: 'json', description: 'Camera position vector' },
  },
}
