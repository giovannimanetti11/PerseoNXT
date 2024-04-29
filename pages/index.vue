  <template>
    <hero />
    <searchfield />
    <browse-by-letter />
    <div class="content">
      <h3 class="mt-24 text-base text-black text-center">
        In sviluppo con <Icon name="logos:nuxt-icon" style="vertical-align: middle;" size="1.5em" />
        <a href="https://nuxt.com/">Nuxt 3</a> <Icon name="emojione:red-heart" style="vertical-align: middle;" size="1.5em" />
      </h3>
    </div>
  </template>

  <script setup>
    import { Icon } from '#components'
    import hero from '~/components/hero.vue';
    import browseByLetter from '~/components/browse-by-letter.vue';
    import Searchfield from '~/components/searchfield.vue';
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
  