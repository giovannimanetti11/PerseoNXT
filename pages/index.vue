  <template>
    <hero />
    <searchfield />
    <browse-by-letter />
    <section-blog />
  </template>

  <script setup>
    import hero from '~/components/hero.vue';
    import Searchfield from '~/components/searchfield.vue';
    import browseByLetter from '~/components/browse-by-letter.vue';
    import sectionBlog from '~/components/section-blog.vue';
  </script>


  
  <style scoped>
    .content {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .content h3 a {
      color: #0DA6A4;
    }
    
    .icon {
      margin: 0 10px;
    }
    
    .Icon {
      vertical-align: middle;
    }
  </style>
  