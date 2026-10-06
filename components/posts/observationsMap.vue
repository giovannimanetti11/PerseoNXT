<template>
  <div class="relative w-full md:w-10/12 mt-4 ml-auto print:hidden">
    <div class="relative w-full h-80">
      <div ref="mapElement" class="w-full h-full border rounded-2xl"></div>
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl">
        <div class="flex flex-col items-center gap-2">
          <icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste" />
          <span v-if="loadedCount > 0" class="text-xs text-gray-500">{{ loadedCount.toLocaleString('it-IT') }} osservazioni caricate...</span>
        </div>
      </div>
    </div>
    <div class="flex flex-row items-center justify-between w-full py-2 px-2 md:px-4 bg-white">
      <p class="text-left text-sm">
        Osservazioni di <span class="font-bold italic">{{ nomeScientifico }}</span> nel 2025
        <span v-if="loadedCount > 0" class="text-xs text-gray-400 ml-1">({{ loadedCount.toLocaleString('it-IT') }})</span>
      </p>
      <p class="text-right text-xs text-gray-400 shrink-0 ml-2">
        <a href="https://www.gbif.org/" target="_blank" rel="noopener noreferrer" class="hover:text-celeste">GBIF</a>
        &nbsp;|&nbsp;
        <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" class="hover:text-celeste">OSM</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Circle as CircleStyle, Fill, Style, Text } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';

interface Props {
  nomeScientifico: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['error']);

const mapElement = ref<HTMLElement | null>(null);
const loading = ref(true);
const loadedCount = ref(0);

const vectorSource = new VectorSource();
let _map: Map | null = null;
let _evtSource: EventSource | null = null;

const clusterStyle = (feature: Feature): Style => {
  const size = feature.get('features').length;
  const color = size > 250 ? '#036297' : size > 100 ? '#0475a8' : size > 50 ? '#0683b9' : size > 35 ? '#2791ca' : size > 20 ? '#48a0db' : size > 10 ? '#69aeeb' : '#5E9EF4';
  const radius = 10 + size * 0.015;
  return new Style({
    image: new CircleStyle({ radius, fill: new Fill({ color }) }),
    text: new Text({ text: size.toString(), font: '12px Lato', fill: new Fill({ color: '#FFFFFF' }) })
  });
};

const createMap = () => {
  if (!mapElement.value) return;
  _map = new Map({
    target: mapElement.value,
    layers: [
      new TileLayer({
        source: new OSM({
          attributions: [],
          tileLoadFunction: (tile: any, src: string) => {
            const img = tile.getImage() as HTMLImageElement;
            img.referrerPolicy = 'origin';
            img.src = src;
          }
        })
      }),
      new VectorLayer({ source: new Cluster({ distance: 30, source: vectorSource }), style: clusterStyle })
    ],
    view: new View({ center: fromLonLat([0, 0]), zoom: 2 }),
    controls: defaultControls({ attribution: false, rotate: false, zoom: false })
  });
};

const loadData = (name: string) => {
  if (!name) return;

  if (_evtSource) {
    _evtSource.close();
    _evtSource = null;
  }

  loading.value = true;
  loadedCount.value = 0;
  vectorSource.clear();

  const evtSource = new EventSource(`/api/gbif-observations?name=${encodeURIComponent(name)}&stream=1`);
  _evtSource = evtSource;

  evtSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.error) {
        emit('error', data.error);
        evtSource.close();
        _evtSource = null;
        loading.value = false;
        return;
      }

      if (data.points?.length) {
        for (const { lon, lat } of data.points) {
          vectorSource.addFeature(new Feature({
            geometry: new Point(fromLonLat([lon, lat]))
          }));
        }
        loadedCount.value += data.points.length;
      }

      if (data.done) {
        evtSource.close();
        _evtSource = null;
        loading.value = false;
      }
    } catch { /* parse error, ignora */ }
  };

  evtSource.onerror = () => {
    emit('error', 'Errore nel caricamento delle osservazioni');
    evtSource.close();
    _evtSource = null;
    loading.value = false;
  };
};

onMounted(() => {
  createMap();
});

onUnmounted(() => {
  if (_evtSource) {
    _evtSource.close();
    _evtSource = null;
  }
});

watch(() => props.nomeScientifico, (name) => {
  if (name) loadData(name);
}, { immediate: true });
</script>
