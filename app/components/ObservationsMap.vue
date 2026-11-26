<template>
  <div class="relative w-full md:w-10/12 mt-4 ml-auto print:hidden">
    <div class="relative w-full h-80">
      <div ref="mapElement" class="w-full h-full border rounded-2xl"></div>
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl">
        <div class="flex flex-col items-center gap-2">
          <Icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste" />
          <span v-if="count > 0" class="text-xs text-gray-500">{{ count.toLocaleString('it-IT') }} osservazioni caricate</span>
        </div>
      </div>
      <p v-if="error" class="absolute inset-x-0 bottom-4 text-center text-sm text-gray-600">{{ error }}</p>
    </div>
    <div class="flex flex-row items-center justify-between w-full py-2 px-2 md:px-4 bg-white">
      <p class="text-left text-sm">
        Osservazioni di <span class="font-bold italic">{{ nomeScientifico }}</span><template v-if="year"> nel {{ year }}</template>
        <span v-if="count > 0" class="text-xs text-gray-400 ml-1">({{ count.toLocaleString('it-IT') }})</span>
      </p>
      <p class="text-right text-xs text-gray-400 shrink-0 ml-2">
        <a href="https://www.gbif.org/" target="_blank" rel="noopener noreferrer" class="hover:text-celeste">GBIF</a>
        |
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="hover:text-celeste">© OpenStreetMap</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import OlMap from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Cluster from 'ol/source/Cluster'
import OSM from 'ol/source/OSM'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import type { FeatureLike } from 'ol/Feature'
import { fromLonLat } from 'ol/proj'
import { Circle as CircleStyle, Fill, Style, Text } from 'ol/style'
import { defaults as defaultControls } from 'ol/control'
import type { ObservationMessage } from '#shared/types/content'

const props = defineProps<{ nomeScientifico: string }>()

const mapElement = ref<HTMLElement | null>(null)
const loading = ref(true)
const count = ref(0)
const year = ref<number | null>(null)
const error = ref('')

const source = new VectorSource()
let map: OlMap | null = null
let resizeObserver: ResizeObserver | null = null
let events: EventSource | null = null

const CLUSTER_COLORS: [number, string][] = [[250, '#036297'], [100, '#0475a8'], [50, '#0683b9'], [35, '#2791ca'], [20, '#48a0db'], [10, '#69aeeb']]

function clusterStyle(feature: FeatureLike): Style {
  const features: unknown = feature.get('features')
  const size = Array.isArray(features) ? features.length : 1
  const color = CLUSTER_COLORS.find(([threshold]) => size > threshold)?.[1] ?? '#5E9EF4'
  return new Style({
    image: new CircleStyle({ radius: 10 + size * 0.015, fill: new Fill({ color }) }),
    text: new Text({ text: String(size), font: '12px Lato', fill: new Fill({ color: '#FFFFFF' }) }),
  })
}

function stop() {
  events?.close()
  events = null
}

function load(name: string) {
  stop()
  source.clear()
  loading.value = true
  count.value = 0
  error.value = ''

  const stream = new EventSource(`/api/gbif-observations?name=${encodeURIComponent(name)}`)
  events = stream

  stream.onmessage = (event: MessageEvent<string>) => {
    const message = JSON.parse(event.data) as ObservationMessage
    year.value = message.year
    if (message.points.length) {
      source.addFeatures(message.points.map(({ lon, lat }) => new Feature({ geometry: new Point(fromLonLat([lon, lat])) })))
      count.value += message.points.length
    }
    if (message.error) error.value = message.error
    if (message.done) {
      stop()
      loading.value = false
    }
  }
  stream.onerror = () => {
    stop()
    loading.value = false
    if (!count.value) error.value = 'Osservazioni non disponibili'
  }
}

onMounted(() => {
  if (!mapElement.value) return
  map = new OlMap({
    target: mapElement.value,
    layers: [
      new TileLayer({ source: new OSM({ attributions: [] }) }),
      new VectorLayer({ source: new Cluster({ distance: 30, source }), style: clusterStyle }),
    ],
    view: new View({ center: fromLonLat([0, 0]), zoom: 2 }),
    controls: defaultControls({ attribution: false, rotate: false, zoom: false }),
  })
  // The map can mount inside a closed section (accordion on phones): resize it when it becomes visible.
  resizeObserver = new ResizeObserver(() => map?.updateSize())
  resizeObserver.observe(mapElement.value)
  load(props.nomeScientifico)
})

watch(() => props.nomeScientifico, (name, previous) => {
  if (name && name !== previous) load(name)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  stop()
  map?.setTarget(undefined)
  map?.dispose()
  map = null
})
</script>
