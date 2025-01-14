const path = require('path')
const fs = require('fs')
const template = require('lodash.template')
const objectAssignDeep = require('object-assign-deep')

const defaultIubendaConfig = {
  // Required:
  siteId: null,
  cookiePolicyId: null,

  // Optional:
  lang: 'en',
  gdprAppliesGlobally: false,
  cookiePolicyInOtherWindow: false,
  consentOnContinuedBrowsing: false,
  perPurposeConsent: true,
  banner: {
    acceptButtonDisplay: true,
    customizeButtonDisplay: true,
    rejectButtonDisplay: false,
    acceptButtonColor: 'black',
    acceptButtonCaptionColor: 'white',
    customizeButtonColor: '#bbb',
    customizeButtonCaptionColor: 'black',
    rejectButtonColor: 'white',
    rejectButtonCaptionColor: 'black',
    closeButtonDisplay: false,
    position: 'float-bottom-right',
    textColor: '#333',
    backgroundColor: '#ddd'
  }
}

const defaultModuleOptions = {
  dev: true, // Activate module in dev environment.
  consentMode: true, // Use Google's consent mode.
  links: {
    enable: true, // Add script to include links to policy pages.
    style: 'nostyle', // Add styling to links. (nostyle, white or black)
    whiteLabel: true, // White label links.
    embed: true // Open links in popup.
  },
  config: defaultIubendaConfig, // Iubenda configuration object.
  i18n: {}
}

function getScript (options, env) {
  const filePath = path.resolve(__dirname, 'script.js')
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const compiler = template(fileContents, { variable: 'options' })
  const script = compiler({
    ...options,
    config_json: JSON.stringify(options.config),
    env
  })
  return script
}

module.exports = function (moduleOptions) {
  moduleOptions = objectAssignDeep(defaultModuleOptions, this.options.iubenda, moduleOptions)

  this.nuxt.hook('render:route', (url, result, context) => {
    const localeCookie = context?.req?.headers?.cookie
        ?.split(';')
        ?.find((cookie) => cookie.trim().startsWith('i18n_redirected='))
        ?.split('=')[1]
    
    if (localeCookie !== moduleOptions.config.lang) {
      moduleOptions.config.lang = localeCookie
    }
    console.log('found locale cookie render:route')
    console.log(localeCookie)
  })

  // Always add plugin to avoid errors on dev.
  this.addPlugin({
    src: path.resolve(__dirname, 'plugin.js'),
    options: moduleOptions
  })

  // Check required options
  if (!moduleOptions.config.siteId || !moduleOptions.config.cookiePolicyId) {
    console.warn(
      '[nuxt-iubenda] siteId and cookiePolicyId are required options.'
    )
    return
  }

  // Skip dev env.
  if (this.options.dev === true && moduleOptions.dev === false) {
    return
  }

  this.options.head.script = this.options.head.script || []

  // Add our setup script.
  this.options.head.script.push({
    hid: 'iubenda-setup',
    innerHTML: getScript(moduleOptions, this.options.dev ? 'dev' : 'prod')
  })

  // Add Iubenda script.
  this.options.head.script.push({
    hid: 'iubenda-cs-script',
    src: '//cdn.iubenda.com/cs/iubenda_cs.js'
  })

  if (moduleOptions.links.enable) {
    this.options.head.script.push({
      hid: 'iubenda-script',
      src: '//cdn.iubenda.com/iubenda.js',
      async: true
    })
  }

  // Disable sanitazions
  this.options.head.__dangerouslyDisableSanitizersByTagID =
    this.options.head.__dangerouslyDisableSanitizersByTagID || {}
  this.options.head.__dangerouslyDisableSanitizersByTagID['iubenda-setup'] = [
    'innerHTML'
  ]
  this.options.head.__dangerouslyDisableSanitizersByTagID[
    'iubenda-cs-script'
  ] = ['innerHTML']
  this.options.head.__dangerouslyDisableSanitizersByTagID['iubenda-script'] = [
    'innerHTML'
  ]
}

module.exports.meta = require('../package.json')
