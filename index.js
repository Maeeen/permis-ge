#!/usr/bin/env node

;(async function() {
    const yargs = require('yargs/yargs')
    const { hideBin } = require('yargs/helpers')
    const axios = require('axios')
    const argv = yargs(hideBin(process.argv)).argv
    const url = require('url')
    const parser = require('node-html-parser').parse
    
    const HOME_URL = "https://ge.ch/cari-online/examensPublic"
    const LOOKUP_STRING = "pas de rendez-vous disponible cette semaine"
    const NB_ITER = 20


    let abort = () => {
        console.log('Usage: ./<executable> --n <Numéro de registre> --birthday <DD/MM/YYYY>')
        return process.exit(0)
    }

    let find_period_interval = root => {
        const all = root.querySelectorAll('.columnTitle')
        return `${all[0].innerText} - ${all.slice(-1)[0].innerText}`
    }

    let paraming = obj => new (url.URLSearchParams)(obj).toString()

    if (!argv.n || !argv.birthday || argv.h || argv.help) return abort()
    // check birthday
    let { birthday } = argv
    birthday = birthday.split("/")
    if (birthday.length != 3) return abort()
    // connecting to ge.ch
    console.log("Connexion au site de Genève")

    let check_if_wanted = root => {
        const all = root.querySelectorAll('.columnTitle');
        const date = /((\d{2,4}).){3}/gi.exec(all[0].innerText)[0]
        if (date.split(".").length != 3) return true;
        const [day, month, year] = date.split(".")
        const dateObj = new Date(year, month -1, day)
        if (dateObj - new Date(2022, 08 - 1, 28) >= 0) {
            return true;
        } else return false;
    }


    let loop = async () => {


        const init = await axios.get(HOME_URL)
        if (init.status != 200) {console.log("Erreur lors de la connexion."); return abort()}
        let headers = { cookie: init.headers['set-cookie'] }
        const login = await axios.post(HOME_URL, paraming({
            pageContext: "login",
            noConvocation: "",
            noReg: argv.n,
            dateJJ: birthday[0],
            dateMM: birthday[1],
            dateAAAA: birthday[2],
            valider: "Valider"
    }   ), { headers })
        if (login.status != 200) {console.log("Erreur lors de la connexion."); return abort()}
        
        const parsed = parser(login.data)
        const dest_url = parsed.querySelector('a').getAttribute('href')


        console.log("La connexion s'est correctement déroulée. Recherche de créneaux…")

        headers = { cookie: login.headers['set-cookie'] }
        let current = await axios.get(`https://ge.ch${dest_url}`, { headers })
        const current_parsed = parser(current.data)
        const place = current_parsed.querySelector('option').getAttribute('value')

        current = await axios.post(HOME_URL, paraming({
            pageContext: "selectDate",
            lieu: place,
            prevWeek: ""
        }) + "&prevWeek=&prevWeek=", { headers })
        // begin navigating
        // sanity check
        if (!current.data.includes(LOOKUP_STRING)) { console.log("OUAAA CHELOU SA IMO."); return abort()}
    
        for(let i = 0; i < NB_ITER; i++) {
            headers = { cookie: current.headers['set-cookie'] ? current.headers['set-cookie'] : headers.cookie }
            current = await axios.post(HOME_URL, paraming({
                pageContext: "selectDate",
                lieu: place,
                nextWeek: ""
            }) + "&nextWeek=&nextWeek=", { headers })
            if (!current.data.includes(LOOKUP_STRING)) {
                const parsed = parser(current.data)
                if (check_if_wanted(parsed)) {
                    console.log(`RENDEZ VOUS DISPONIBLE SUR LA PÉRIODE ${find_period_interval(parser(parsed))} !!!`)
                    if (argv.webhook) axios.post(argv.webhook, { username: "Machin chouette", embeds: [], content : `${argv.inst ? argv.inst + " → " : ""} @everyone, trouvé sur cette période ${find_period_interval(parser(parsed))}`}).catch(err => console.log("oops while webhook"))
                    return
                }
            }
        }
        console.log(`Rien trouvé jusqu'à la période (incluse) : ${find_period_interval(parser(current.data))}. Tentative de recherche dans 15 min.`)
        if (argv.webhook) axios.post(argv.webhook, { username: "Machin chouette", embeds: [], content : `${argv.inst ? argv.inst + " = " : ""} rien de trouvé jusqu'à cette période ${find_period_interval(parser(current.data))}. Je suis tjrs en vie!!`}).catch((err, inst) => console.log("oops while webhook", err, inst))
        setTimeout(() => loop(), 15 * 60 * 1000)
    }

    loop()
})()