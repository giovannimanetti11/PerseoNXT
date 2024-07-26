<template>
  <div class="relative w-full md:w-10/12 h-96 mt-4 ml-auto print:hidden">
    <div ref="mapElement" class="w-full h-full border rounded-2xl"></div>
    <div v-if="loading" class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
      <icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste" />
    </div>
    <div class="flex flex-col md:flex-row justify-between w-full py-2 px-2 md:px-4 bg-white">
          <p class="text-center md:text-left text-base">Osservazioni di <span class="font-bold italic">{{ nomeScientifico }}</span> nel 2023.</p>
          <p class="text-center md:text-left text-xs"> Credits: <a href="https://www.gbif.org/" target="_blank" class="text-blu hover:text-celeste">GBIF</a> | <a href="https://www.openstreetmap.org/" target="_blank" class="text-blu hover:text-celeste">OpenStreetMap</a></p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, reactive, defineProps, defineEmits } from 'vue';
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
import { defaults as defaultControls, Rotate } from 'ol/control';

// Props definition with validation
const props = defineProps({
  nomeScientifico: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['error']);

const mapElement = ref(null);
const loading = ref(false);
const data = reactive({ totalCount: 0 });
const vectorSource = new VectorSource();
let map = null;

const MAX_BATCHES = 11;
const BATCH_SIZE = 300;

// Fetching taxon key with error handling
const fetchTaxonKey = async (scientificName) => {
  try {
    const response = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.usageKey;
  } catch (error) {
    emit('error', error.message);
    return null;
  }
};

const fetchOccurrencesWithLimits = async (taxonKey, offset, limit) => {
  try {
    const response = await fetch(`https://api.gbif.org/v1/occurrence/search?taxon_key=${taxonKey}&year=2023&hasCoordinate=true&basisOfRecord=HUMAN_OBSERVATION&offset=${offset}&limit=${limit}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  } catch (error) {
    emit('error', error.message);
    return { results: [], endOfRecords: true };
  }
};

const addFeaturesToMap = (occurrences) => {
  occurrences.forEach(occurrence => {
    if (occurrence.decimalLongitude && occurrence.decimalLatitude) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([occurrence.decimalLongitude, occurrence.decimalLatitude]))
      });
      vectorSource.addFeature(feature);
    }
  });
};

const createMap = () => {
  map = new Map({
    target: mapElement.value,
    layers: [
      new TileLayer({
        source: new OSM({
          attributions: null
        })
      }),
      new VectorLayer({
        source: new Cluster({
          distance: 30,
          source: vectorSource
        }),
        style: feature => clusterStyle(feature)
      })
    ],
    view: new View({
      center: fromLonLat([0, 0]),
      zoom: 2
    }),
    controls: defaultControls({ attribution: false, rotate: false, zoom: false })
  });
  const rotateControl = map.getControls().getArray().find(control => control instanceof Rotate);
  if (rotateControl) {
    map.removeControl(rotateControl);
  }
};

const clusterStyle = (feature) => {
  const size = feature.get('features').length;
  const color = size > 250 ? '#036297' : size > 100 ? '#0475a8' : size > 50 ? '#0683b9' : size > 35 ? '#2791ca' : size > 20 ? '#48a0db' : size > 10 ? '#69aeeb' : '#5E9EF4';

  const radius = 10 + size * 0.015;
  return new Style({
    image: new CircleStyle({
      radius: radius,
      fill: new Fill({ color }),
    }),
    text: new Text({
      text: size.toString(),
      font: '12px Lato',
      fill: new Fill({ color: '#FFFFFF' })
    })
  });
};

onMounted(() => {
  createMap();
});

watch(() => props.nomeScientifico, async (newName) => {
  if (newName) {
    loading.value = true;
    const taxonKey = await fetchTaxonKey(newName);
    if (!taxonKey) {
      loading.value = false;
      return;
    }

    let offset = 0;
    let batchCount = 0;
    let hasMore = true;

    while (hasMore && batchCount < MAX_BATCHES) {
      const { results, endOfRecords } = await fetchOccurrencesWithLimits(taxonKey, offset, BATCH_SIZE);
      addFeaturesToMap(results);
      offset += BATCH_SIZE;
      hasMore = !endOfRecords;
      batchCount++;
    }

    loading.value = false;
  }
}, { immediate: true });
</script>

<style scoped>
.map-container {
  height: 100%;
}
</style>
