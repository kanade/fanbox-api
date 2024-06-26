import fs from 'fs'
import yaml from 'js-yaml'
import appRootPath from 'app-root-path'
import deepmerge from 'deepmerge'

const config = yaml.load(fs.readFileSync(appRootPath.resolve('./config.yaml'), 'utf8'), { schema: yaml.FAILSAFE_SCHEMA }) as any

const fallbackConfig = {
    pixiv: {
        email: '',
        password: '',
    },
    server: {
        port: '3000',
    },
    cf_clearance: '',
    user_agent: '',
    headless: 'true',
    errorLog: 'false',
}

export default deepmerge(fallbackConfig, config)