  <template>
    <div class="content">
      <h1>
        In sviluppo con <Icon name="logos:nuxt-icon" style="vertical-align: middle;" size="1.5em" />
        Nuxt 3 <Icon name="emojione:red-heart" style="vertical-align: middle;" size="1.5em" />
      </h1>
    </div>
  </template>
  
  <script setup>
  import { Icon } from '#components'
  </script>
  
  <style scoped>
  .content {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f2f5;
    font-family: 'Lato', sans-serif;
  }
  
  h1 {
    font-size: 2em;
    color: #333;
    text-align: center;
    padding: 20px;
  }
  
  .icon {
    margin: 0 10px;
  }
  
  .Icon {
    vertical-align: middle;
  }
  </style>
  