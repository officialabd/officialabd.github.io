/** @type {import('next').NextConfig} */


// const isGithubActions = process.env.GITHUB_ACTIONS || false

// let assetPrefix = ''
// let basePath = '/'

// if (isGithubActions) {
//     // trim off `<owner>/`
//     const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, '')

//     assetPrefix = `/${repo}/`
//     basePath = `/${repo}`
// }

module.exports = {
    // assetPrefix: assetPrefix,
    // basePath: basePath,
    // images: {
    //     loader: 'imgix',
    //     path: 'https://officialabdib-imgs.imgix.net/public/',
    // },
    output: 'export',
    // images: {
    //     domains: [
    //         'firebasestorage.googleapis.com',
    //         'gs://my-portfolio-ed76f.appspot.com'
    //     ],
    //     // loader: 'imgix',
    //     // path: '',
    // },
}