  <template>
    <hero />
    <div class="content">
      <h3 class="mt-24 text-base text-black text-center">
        In sviluppo con <Icon name="logos:nuxt-icon" style="vertical-align: middle;" size="1.5em" />
        Nuxt 3 <Icon name="emojione:red-heart" style="vertical-align: middle;" size="1.5em" />
      </h3>
    </div>
  </template>
  
  <script setup>
  import { Icon } from '#components'
  import hero from '~/components/hero.vue'
  </script>
  
  <style scoped>
  .content {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .icon {
    margin: 0 10px;
  }
  
  .Icon {
    vertical-align: middle;
  }
  </style>
  