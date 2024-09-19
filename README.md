# PerseoNXT

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![last commit](https://img.shields.io/github/last-commit/giovannimanetti11/PerseoNXT)
![language](https://img.shields.io/github/languages/top/giovannimanetti11/PerseoNXT)
![release](https://img.shields.io/github/v/release/giovannimanetti11/PerseoNXT?include_prereleases)

PerseoNXT is a custom Nuxt3-based theme designed specifically for headless WordPress websites, tailored for the project [wikiherbalist.com](https://wikiherbalist.com). This theme is now live and can be seen in action at [wikiherbalist.com](https://wikiherbalist.com).

<p align="center">
<img src="https://github.com/user-attachments/assets/1b48f4bd-8628-4e8f-bea2-8e28bf12b7d6" alt="homepage" width="300">
</p>

## Features

- **Vue3**: built with Vue3, Composition API, reactivity system;
- **Nuxt3**: latest Nuxt3 framework for server-side rendering, static site generation, and client-side navigation;
- **GraphQL and Apollo**: GraphQL with Apollo for efficient data fetching, real-time updates and flexible querying capabilities;
- **Tailwind CSS**: integrates Tailwind CSS for utility-first, responsive, and highly customizable styling;
- **ESLint**: ensures code quality and consistency with ESLint configurations;
- **Responsive design**: fully responsive layout that works seamlessly across desktop, tablet, and mobile devices;
- **SEO optimized**: implements best practices for search engine optimization;
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

Before running the project, you need to set up a `config.js` file in the root directory with your API keys and other configuration details. Create a file named `config.js` with the following structure:

```javascript
export const apiConfig = {
  baseUrl: 'GRAPHQL_URL',
  appPassword: 'WORDPRESS_APP_PASSWORD',
  username: 'YOUR_WORDPRESS_USERNAME',
  pubMedApiKey: '',
  amazonPollyAccess: '',
  amazonPollySecret: '',
  algoliaAppId: '',
  algoliaSearchAPIKey: '',
  algoliaWriteAPIKey: '',
  algoliaAdminAPIKey: '',
  algoliaUsageAPIKey: '',
  algoliaMonitoringAPIKey: '',
  sendGridApiKey: '',
  recaptchaPublicKey: '',
  recaptchaSecretKey: '',
  MailchimpAPIKey: '',
  MailchimpListID: '',
  MailchimpServerPrefix: '',
  dbHost: 'YOUR_DATABASE_HOST',
  dbUser: 'YOUR_DATABASE_USER',
  dbPassword: 'YOUR_DATABASE_PASSWORD',
  dbName: 'YOUR_DATABASE_NAME',
  name: 'WEBSITE_NAME',
  url: 'WEBSITE_URL',
  description: 'WEBSITE_DESCRIPTION'
};
```

Replace the placeholder values with your actual API keys and configuration details. This file is crucial for the proper functioning of various features in PerseoNXT.

**Note**: Make sure to add `config.js` to your `.gitignore` file to avoid exposing sensitive information in your repository.

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

We invite you to be a part of this project and help enhance the theme for wikiherbalist.com, an open-source and not-for-profit project. Your contributions can make a real difference in creating a robust and feature-rich theme for headless WordPress sites.
