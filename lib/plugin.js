export default function (ctx, inject) {
  const { app } = ctx
  const i18nSettings = JSON.parse(`<%= JSON.stringify(options.i18n) %>`)
  let localeCookiePolicyId = null

  console.dir(ctx?.app?.i18n?.locale)
  console.dir(JSON.stringify(app.i18n))
  console.log(JSON.stringify(ctx?.req?.headers?.cookie))
  const localeCookie = ctx?.req?.headers?.cookie
    ?.split(';')
    .find((cookie) => cookie.trim().startsWith('locale='))

  console.log('found outer locale cookie')
  console.log(localeCookie)

  if (app.i18n && app.i18n.locale) {
    const { locale } = app.i18n
    if (i18nSettings[locale]) {
      localeCookiePolicyId = i18nSettings[locale].cookiePolicyId
    }
  }

  const linksStyle = '<%= options.links.style %>'
  const whiteLabel = '<%= options.links.whiteLabel %>'
  const embed = '<%= options.links.embed %>'
  const cookiePolicyId = localeCookiePolicyId || '<%= options.config.cookiePolicyId %>'
  const baseUrl = 'https://www.iubenda.com'
  const apiUrl = `${baseUrl}/api`
  const privacyPolicyUrl = `${baseUrl}/privacy-policy/${cookiePolicyId}`
  const cookiePolicyUrl = `${privacyPolicyUrl}/cookie-policy`
  const privacyPolicyApiUrl = `${apiUrl}/privacy-policy/${cookiePolicyId}`
  const cookiePolicyApiUrl = `${privacyPolicyApiUrl}/cookie-policy`

  const linksClass = `iubenda-${linksStyle} ${
    whiteLabel ? 'no-brand' : ''
  } iubenda-noiframe ${embed ? 'iubenda-embed' : ''}`

  function getPrivacyPolicyLinkHtml(label = 'Privacy Policy', attributes = {}) {
    const { classes } = attributes
    return `<a
        href="${privacyPolicyUrl}"
        class="${linksClass} ${classes}"
        title="${label}">${label}</a>`
  }

  function getCookiePolicyLinkHtml(label = 'Cookie Policy', attributes = {}) {
    const { classes } = attributes
    return `<a
        href="${cookiePolicyUrl}"
        class="${linksClass} ${classes}"
        title="${label}">${label}</a>`
  }

  const iub = {
    privacyPolicyUrl,
    cookiePolicyUrl,
    privacyPolicyApiUrl,
    cookiePolicyApiUrl,
    getPrivacyPolicyLinkHtml,
    getCookiePolicyLinkHtml,
  }

  inject('iubenda', iub)
}
