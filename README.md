# PerseoNXT

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![last commit](https://img.shields.io/github/last-commit/giovannimanetti11/PerseoNXT)
![language](https://img.shields.io/github/languages/top/giovannimanetti11/PerseoNXT)
![release](https://img.shields.io/github/v/release/giovannimanetti11/PerseoNXT?include_prereleases)

PerseoNXT is a custom Nuxt 4-based theme designed specifically for headless WordPress websites, tailored for the project [wikiherbalist.com](https://wikiherbalist.com). This theme is now live and can be seen in action at [wikiherbalist.com](https://wikiherbalist.com).

<p align="center">
<img src="https://github.com/user-attachments/assets/1b48f4bd-8628-4e8f-bea2-8e28bf12b7d6" alt="homepage" width="300">
</p>

## Features

- **Vue 3**: built with Vue 3, Composition API, reactivity system;
- **Nuxt 4**: latest Nuxt 4 framework with improved performance and SEO;
- **GraphQL**: native GraphQL integration using Nuxt's $fetch (no Apollo dependency);
- **Nuxt Algolia**: integrated Algolia module for powerful search capabilities;
- **Tailwind CSS**: integrates Tailwind CSS for utility-first, responsive, and highly customizable styling;
- **TypeScript**: full TypeScript support with type definitions for enhanced development experience;
- **ESLint**: ensures code quality and consistency with ESLint configurations;
- **Advanced SEO**: automated sitemap generation, canonical URLs, schema markup, and proper SSR meta tags;
- **GDPR Compliance**: cookie banner with consent management, privacy policy, and cookie policy pages;
- **XSS Protection**: all HTML content sanitized to prevent injection attacks;
- **Responsive design**: fully responsive layout that works seamlessly across desktop, tablet, and mobile devices;
- **Async data handling**: optimized data fetching with loading states and error handling;
- **Performance focused**: optimized for fast loading times and efficient resource usage.

<p align="center">
  <img src="https://github.com/user-attachments/assets/1ba482cb-f808-4e3b-b42b-7ae20b2c8d58" alt="Page Speed Insights" width="300">
</p>

## Installation

To get started with PerseoNXT, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/giovannimanetti11/PerseoNXT.git
   ```

2. **Navigate to the project directory**:
   ```bash
   cd PerseoNXT
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up configuration** (see Configuration section below)

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Configuration

Before running the project, you need to set up environment variables. Copy the `.env.example` file to `.env` and fill in your configuration details:

```bash
cp .env.example .env
```

Then edit the `.env` file with your actual values:

```bash
# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret

# Algolia
NUXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
NUXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_algolia_search_api_key
ALGOLIA_ADMIN_API_KEY=your_algolia_admin_api_key
ALGOLIA_USAGE_API_KEY=your_algolia_usage_api_key
ALGOLIA_WRITE_API_KEY=your_algolia_write_api_key
ALGOLIA_MONITORING_API_KEY=your_algolia_monitoring_api_key
ALGOLIA_ACCESS_PASSWORD=your_algolia_access_password

# WordPress GraphQL API
WP_BASE_URL=https://your-wordpress-site.com/graphql
WP_APP_PASSWORD=your_wordpress_app_password
WP_USERNAME=your_wordpress_username

# PubMed API
PUBMED_API_KEY=your_pubmed_api_key

# Amazon Polly
AMAZON_POLLY_ACCESS_KEY=your_amazon_polly_access_key
AMAZON_POLLY_SECRET_KEY=your_amazon_polly_secret_key

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# reCAPTCHA v3
RECAPTCHA_PUBLIC_KEY=your_recaptcha_public_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Mailchimp
MAILCHIMP_API_KEY=your_mailchimp_api_key
MAILCHIMP_LIST_ID=your_mailchimp_list_id
MAILCHIMP_SERVER_PREFIX=us17

# Database (MySQL)
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

**Note**: The `.env` file is already in `.gitignore` to avoid exposing sensitive information in your repository.

### Production Deployment with PM2

When deploying to production using PM2, environment variables must be configured in the `ecosystem.config.cjs` file. PM2 does not automatically load `.env` files, so all environment variables must be explicitly defined in the ecosystem configuration:

```javascript
module.exports = {
  apps: [{
    name: 'your-app-name',
    script: './.output/server/index.mjs',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      WP_BASE_URL: 'your_wordpress_url',
      WP_APP_PASSWORD: 'your_password',
      WP_USERNAME: 'your_username',
      // ... add all other environment variables here
    }
  }]
}
```

⚠️ **Important**: After updating environment variables in `ecosystem.config.cjs`, you must rebuild the application for changes to take effect:

```bash
npm run build
pm2 restart your-app-name
```

## Usage

After installation and configuration, you can start developing your own headless WordPress site using PerseoNXT as a base. Customize the theme to fit your specific needs and design preferences.

## Contributing

Contributions to PerseoNXT are welcome and appreciated. Whether you're fixing bugs, adding new features, or improving documentation, your help is valuable. Here's how you can contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For any inquiries or further information, please contact the project maintainer:

Giovanni Manetti - [giovanni@perseodesign.com](mailto:giovanni@perseodesign.com)

Project link: [https://github.com/giovannimanetti11/PerseoNXT](https://github.com/giovannimanetti11/PerseoNXT)

---

You are invited to be a part of this project and help enhance the theme of wikiherbalist.com, an open-source and not-for-profit project. Your contributions can make a real difference in creating a robust and feature-rich theme for headless WordPress sites.
