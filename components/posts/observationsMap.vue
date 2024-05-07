<template>
    <div class="relative w-10/12 h-96 mt-4 ml-auto">
      <div ref="mapElement" class="w-full h-full border rounded-2xl"></div>
      <div v-if="loading" class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste" />
      </div>
      <div class="absolute bottom-0 left-0 w-full p-4 bg-white text-sm">
        <p>Numero totale di osservazioni umane nel mondo di <span class="font-bold italic">{{ nomeScientifico }}</span> nel 2023. Credits: <a href="https://www.gbif.org/" target="_blank" class="text-blu hover:text-celeste">GBIF</a> | <a href="https://www.openstreetmap.org/" target="_blank" class="text-blu hover:text-celeste">OpenStreetMap</a>.</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, watch, reactive } from 'vue';
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
  import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
  import { Zoom, defaults as defaultControls } from 'ol/control';
  
  const props = defineProps({
    nomeScientifico: String
  });
  
  const mapElement = ref(null);
  const loading = ref(false);
  const data = reactive({ totalCount: 0 });
  
  const fetchTaxonKey = async (scientificName) => {
    const response = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`);
    const data = await response.json();
    return data.usageKey;
  };
  
  const fetchOccurrences = async (taxonKey) => {
    loading.value = true;
    let offset = 0;
    const limit = 300;
    let results = [];
    let hasMore = true;
  
    while (hasMore) {
      const response = await fetch(`https://api.gbif.org/v1/occurrence/search?taxon_key=${taxonKey}&year=2023&hasCoordinate=true&basisOfRecord=HUMAN_OBSERVATION&offset=${offset}&limit=${limit}`);
      const batch = await response.json();
      results = results.concat(batch.results);
      offset += limit;
      if (batch.endOfRecords) {
        hasMore = false;
      }
    }
  
    loading.value = false;
    data.totalCount = results.length;
    return results;
  };
  
  const createMap = (vectorSource) => {
    const map = new Map({
      target: mapElement.value,
      layers: [
        new TileLayer({
          source: new OSM({
            attributions: null
          })
        }),
        new VectorLayer({
          source: new Cluster({
            distance: 15,
            source: vectorSource
          }),
          style: feature => clusterStyle(feature)
        })
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2
      }),
      controls: defaultControls({ attribution: false, rotate: false, zoom: false }).extend([
        new Zoom({ zoomInLabel: '+', zoomOutLabel: '-', zoomInTipLabel: 'Zoom in', zoomOutTipLabel: 'Zoom out' })
      ])
    });
    return map;
  };
  
  const clusterStyle = (feature) => {
    const size = feature.get('features').length;
    const color = size > 250 ? '#7f0000': size > 100 ? '#FF0000' : size > 50 ? '#FF4500' : size > 35 ? '#FF8C00' : size > 20 ? '#FFA500' : size > 10 ? '#f1c232' : '#ffff99';
    const radius = 10 + size * 0.075;
    return new Style({
      image: new CircleStyle({
        radius: radius,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#036297', width: 1 })
      }),
      text: new Text({
        text: size.toString(),
        font: '12px Lato',
        fill: new Fill({ color: '#036297' })
      })
    });
  };
  
  let map = null;
  
  onMounted(() => {
    const vectorSource = new VectorSource();
    map = createMap(vectorSource);
    watch(() => props.nomeScientifico, async (newName) => {
      if (newName) {
        const taxonKey = await fetchTaxonKey(newName);
        const occurrences = await fetchOccurrences(taxonKey);
        occurrences.forEach(occurrence => {
          const feature = new Feature({
            geometry: new Point(fromLonLat([occurrence.decimalLongitude, occurrence.decimalLatitude]))
          });
          vectorSource.addFeature(feature);
        });
      }
    }, { immediate: true });
  });
  </script>
  
  <style scoped>

  </style>
  