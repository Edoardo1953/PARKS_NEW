(function() {
    console.log("Import script initialized.");

    const citiesData = [
        {
            name: "SWAKOPMUND",
            description: "Situata lungo la costa dell’Oceano Atlantico, Swakopmund è una delle destinazioni turistiche più amate della Namibia. Fondata durante il periodo coloniale tedesco, la città conserva ancora oggi un forte carattere europeo, visibile nell’architettura, nei nomi delle strade e nell’atmosfera generale. Conosciuta per il suo clima fresco, le attività avventurose e la posizione tra oceano e deserto, Swakopmund rappresenta una tappa imperdibile per chi visita la Namibia.\n\nSpesso descritta come la “capitale dell’avventura” del paese, la città offre un mix unico di storia, natura e sport all’aria aperta, rendendola adatta sia a viaggiatori in cerca di relax sia a chi desidera esperienze più dinamiche.\n\nPosizione e ruolo turistico\nSwakopmund si trova sulla costa occidentale della Namibia, circa 350 chilometri a ovest di Windhoek, ed è collegata alla capitale da una moderna strada asfaltata. La sua posizione tra l’Oceano Atlantico e le dune del Namib Desert crea uno scenario spettacolare e unico.\nLa città è anche vicina al porto di Walvis Bay, distante circa 35 chilometri, formando insieme a quest’ultima uno dei principali poli turistici della costa namibiana.\n\nBreve storia\nSwakopmund fu fondata nel 1892 dai coloni tedeschi come porto principale dell’allora Africa Tedesca del Sud-Ovest. L’influenza tedesca è ancora oggi evidente: molti edifici storici conservano lo stile architettonico originale.\n\nAttrazioni principali\nSwakopmund Jetty: un lungo molo che si estende nell’Oceano Atlantico.\nSwakopmund Museum: reperti sulla storia naturale e la fauna del deserto.\nWoermannhaus: antico edificio commerciale con torre panoramica.\n\nAttività avventurose\nSandboarding, escursioni in quad (ATV), paracadutismo, kayak, gite in barca e pesca sportiva.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "44.000 ab.", size: "196 km²", life: "Erongo" }
        },
        {
            name: "WALVIS BAY",
            description: "Situata lungo la costa occidentale della Namibia, Walvis Bay è il principale porto del paese e una delle destinazioni più affascinanti per gli amanti della natura e della fauna marina. A differenza della vicina Swakopmund, famosa per la sua atmosfera coloniale e turistica, Walvis Bay è una città moderna e funzionale, il cui fascino risiede soprattutto negli straordinari paesaggi naturali che la circondano.\n\nIl nome Walvis Bay significa “Baia delle Balene”, un riferimento alla grande presenza di cetacei che frequentavano queste acque in passato. Oggi la città è conosciuta soprattutto per la sua spettacolare laguna, uno degli ecosistemi costieri più importanti dell’Africa australe.\n\nPosizione e caratteristiche geografiche\nWalvis Bay si trova circa 35 chilometri a sud di Swakopmund, lungo una costa dominata dalle dune del Namib Desert. Questa posizione crea un paesaggio unico in cui le alte dune di sabbia dorata sembrano tuffarsi direttamente nell’oceano.\n\nAttrazioni principali\nWalvis Bay Lagoon: area umida che ospita migliaia di uccelli migratori, tra cui fenicotteri rosa e pellicani.\nDune di Sandwich Harbour: dove le gigantesche dune si incontrano con l'oceano, ideale per escursioni in 4x4.\nWalvis Bay Waterfront: zona piacevole per rilassarsi o partire per escursioni in barca.\n\nEscursioni nei dintorni\nPelican Point, una penisola che ospita una delle più grandi colonie di otarie del paese.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "62.000 ab.", size: "1.124 km²", life: "Erongo" }
        },
        {
            name: "LÜDERITZ",
            description: "Situata sulla costa meridionale della Namibia, Lüderitz è una delle città più affascinanti e particolari del paese. Isolata e circondata da paesaggi desertici, questa località conserva un’atmosfera unica, caratterizzata da edifici storici colorati e da un ambiente naturale selvaggio e suggestivo.\n\nFondata durante il periodo coloniale tedesco, Lüderitz è famosa per la sua architettura storica, la sua posizione remota e la vicinanza a uno dei luoghi più misteriosi della Namibia: la città fantasma di Kolmanskop.\n\nPosizione e caratteristiche geografiche\nLüderitz si trova su una costa rocciosa affacciata sull’Oceano Atlantico, in una regione caratterizzata da forti venti e paesaggi aridi. La sua posizione isolata contribuisce al fascino della località, rendendola una destinazione ideale per chi cerca luoghi meno affollati e ricchi di atmosfera.\n\nAttrazioni principali\nKolmanskop: famosa città fantasma situata a pochi chilometri, un tempo prospero centro minerario e oggi abbandonata e parzialmente ricoperta dalla sabbia.\nLüderitz Waterfront: lungomare con splendide viste sull’oceano e sulle isole circostanti.\nFelsenkirche: chiesa costruita su una collina rocciosa che domina la città.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "12.500 ab.", size: "15 km²", life: "Karas" }
        },
        {
            name: "OTJIWARONGO",
            description: "Situata nel centro-nord della Namibia, Otjiwarongo è una delle principali porte di accesso alle aree naturali e alle riserve faunistiche del paese. Grazie alla sua posizione strategica lungo la principale arteria stradale che collega la capitale Windhoek al nord della Namibia e al celebre Etosha National Park, la città rappresenta una tappa importante per molti viaggiatori.\n\nOtjiwarongo è una città moderna e dinamica, circondata da fattorie e terreni agricoli. Il suo nome deriva dalla lingua Herero e significa “luogo bello”, un riferimento al paesaggio verdeggiante che la circonda durante la stagione delle piogge.\n\nPosizione e caratteristiche\nOtjiwarongo si trova a circa 250 chilometri a nord di Windhoek, in una regione caratterizzata da savane aperte, colline dolci e terreni agricoli.\n\nAttrazioni principali\nCheetah Conservation Fund: centro internazionale dedicato alla protezione del ghepardo. I visitatori possono partecipare a tour guidati per conoscere da vicino questi animali.\nCrocodile Ranch: centro dove è possibile osservare coccodrilli di diverse dimensioni.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "28.000 ab.", size: "45 km²", life: "Otjozondjupa" }
        },
        {
            name: "GROOTFONTEIN",
            description: "Situata nel nord-est della Namibia, Grootfontein è una cittadina tranquilla ma storicamente interessante, spesso considerata una delle porte di accesso alle regioni settentrionali del paese. Grazie alla sua posizione lungo le principali rotte di viaggio, rappresenta una tappa frequente per i turisti diretti verso l’est o verso alcune delle attrazioni naturali più remote della Namibia.\n\nIl nome Grootfontein significa “grande sorgente”, un riferimento alla presenza storica di abbondanti fonti d’acqua nella regione, un elemento raro in gran parte del territorio namibiano.\n\nPosizione e caratteristiche\nGrootfontein si trova a circa 450 chilometri a nord-est di Windhoek. La città è parte di un triangolo geografico spesso chiamato “Otavi Triangle”, insieme alle vicine città di Otavi e Tsumeb, una delle regioni più verdi del paese.\n\nAttrazioni principali\nHoba Meteorite: il più grande meteorite conosciuto al mondo ancora nella sua posizione originale. Questo enorme blocco di ferro-nichel pesa circa 60 tonnellate.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "23.000 ab.", size: "70 km²", life: "Otjozondjupa" }
        },
        {
            name: "TSUMEB",
            description: "Situata nel nord della Namibia, Tsumeb è una città storicamente legata all’attività mineraria e rappresenta una delle principali porte di accesso al celebre Etosha National Park. Grazie alla sua posizione strategica e ai buoni servizi disponibili, Tsumeb è una tappa importante per molti viaggiatori diretti verso il nord del paese.\n\nIl nome della città deriva probabilmente da una parola locale che significa “luogo del muschio”, un riferimento alla vegetazione che cresceva nelle aree umide presenti in passato nella regione.\n\nPosizione e caratteristiche\nTsumeb fa parte dell’area conosciuta come “Otavi Triangle”, una delle regioni più fertili e verdi della Namibia.\n\nAttrazioni principali\nTsumeb Museum: ospita una vasta collezione di minerali, manufatti storici e oggetti culturali.\nEscursioni nei dintorni: Lake Otjikoto, un lago naturale di origine carsica profondo e limpido; Lake Guinas.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "19.000 ab.", size: "18 km²", life: "Oshikoto" }
        },
        {
            name: "KEETMANSHOOP",
            description: "Situata nel sud della Namibia, Keetmanshoop è una delle principali città della regione meridionale e rappresenta un importante punto di sosta lungo gli itinerari verso il deserto e la costa meridionale. La città è particolarmente conosciuta per la sua vicinanza a due delle attrazioni naturali più iconiche della Namibia: la Quiver Tree Forest e il Giant's Playground.\n\nFondata nel XIX secolo come stazione missionaria, Keetmanshoop conserva ancora oggi un’atmosfera tranquilla e un carattere storico ben definito.\n\nAttrazioni principali\nQuiver Tree Forest: un’area naturale che ospita numerosi alberi di aloe dichotoma, noti come “quiver trees”.\nGiant's Playground: zona caratterizzata da enormi massi granitici accatastati in modo naturale, che sembrano modellati da una mano gigante.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "20.000 ab.", size: "524 km²", life: "Karas" }
        },
        {
            name: "RUNDU",
            description: "Situata lungo le rive del fiume Okavango River, Rundu è una delle principali città del nord-est della Namibia e rappresenta un importante centro commerciale e culturale della regione del Kavango. Grazie alla sua posizione sul confine con l’Angola, Rundu è una città vivace e dinamica, molto diversa dalle località più turistiche del paese.\n\nIl fiume rappresenta una risorsa vitale per la popolazione locale. Le rive sono caratterizzate da vegetazione rigogliosa, creando un paesaggio piacevole e diverso rispetto alle regioni desertiche.\n\nAttrazioni principali\nRundu Open Market: mercato vivace dove trovare prodotti locali, cibo e artigianato.\nArtigianato locale: Rundu è famosa per la produzione di sculture e oggetti decorativi in legno.\nEscursioni: crociere al tramonto sull'Okavango per osservare la fauna locale.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "63.000 ab.", size: "164 km²", life: "Kavango Est" }
        },
        {
            name: "KATIMA MULILO",
            description: "Situata nell’estremo nord-est della Namibia, nella regione dello Zambezi, Katima Mulilo è una città circondata da paesaggi verdi e corsi d’acqua, molto diversi dalle immagini desertiche tipiche della Namibia. Grazie alla sua posizione lungo il fiume Zambezi River, Katima Mulilo rappresenta una porta d’accesso ideale alle aree naturali della regione.\n\nLa città è spesso utilizzata come base per esplorare parchi naturali e riserve faunistiche. Katima Mulilo si trova vicino ai confini con Zambia, Botswana e Zimbabwe, rendendola un importante nodo geografico e logistico.\n\nAttrazioni principali\nZambezi River: le sue acque offrono opportunità per escursioni in barca e osservazione della fauna.\nBwabwata National Park: parco caratterizzato da foreste e grande varietà di fauna (elefanti, bufali).\nMudumu National Park.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "28.000 ab.", size: "33 km²", life: "Zambezi" }
        },
        {
            name: "OSHAKATI",
            description: "Situata nel cuore della regione di Owambo, Oshakati è una delle città più grandi e vivaci del nord della Namibia. Oshakati rappresenta un importante centro commerciale e culturale e offre ai visitatori un’interessante opportunità per conoscere la vita quotidiana delle comunità locali.\n\nPosizione e caratteristiche\nOshakati si trova in una regione caratterizzata da pianure sabbiose e sistemi di canali naturali chiamati oshana, che si riempiono d’acqua durante la stagione delle piogge.\n\nAttività e attrazioni\nOshakati Open Market: un mercato vivace dove trovare tessuti, utensili e oggetti artigianali tradizionali.\nEventi culturali che celebrano la musica, danza e cultura tradizionale Owambo.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "36.000 ab.", size: "60 km²", life: "Oshana" }
        },
        {
            name: "ONDANGWA",
            description: "Situata nella regione di Oshana, Ondangwa è una città storicamente importante del nord della Namibia, spesso utilizzata come punto di transito e centro logistico per i viaggiatori diretti verso le regioni settentrionali.\n\nCenni storici\nOndangwa ha avuto un ruolo significativo durante il periodo coloniale e durante gli anni della lotta per l’indipendenza. Ospitava una base militare sudafricana.\n\nAttrazioni principali\nNakambale Museum: situato nelle vicinanze, ospitato in una missione storica, offre una panoramica sulla cultura Owambo e sulla presenza missionaria nella regione.\nVillaggi tradizionali, dove osservare abitazioni tipiche e attività quotidiane delle comunità rurali.",
            facts: { label1: "POPOLAZIONE", label2: "SUPERFICIE", label3: "REGIONE", weight: "22.000 ab.", size: "49 km²", life: "Oshana" }
        }
    ];

    window.runCityImport = function() {
        console.log("Esecuzione importazione manuale...");
        let targetList = null;
        let targetDb = null;
        let dbKey = null;

        const findCitiesSubcategory = (dataObj, key) => {
            if(!dataObj || !dataObj.categories) return false;
            for(let c of dataObj.categories) {
                if(!c.subcategories) continue;
                for(let s of c.subcategories) {
                    // Cerca la sottocategoria "CITIES" o qualcosa di simile
                    if(s.name && (s.name.toUpperCase().includes('CIT') || s.name.toUpperCase().includes('CITT'))) {
                        targetList = s.items;
                        targetDb = dataObj;
                        dbKey = key;
                        return true;
                    }
                }
            }
            return false;
        };

        if(window.PARKS_DB) {
            window.PARKS_DB.get('parks_visit_namibia_v1', {categories:[]}, (dataVisit) => {
                if(findCitiesSubcategory(dataVisit, 'parks_visit_namibia_v1')) {
                    insertData();
                } else {
                    window.PARKS_DB.get('parks_library_v2', {categories:[]}, (dataLib) => {
                        if(findCitiesSubcategory(dataLib, 'parks_library_v2')) {
                            insertData();
                        } else {
                            alert("ERRORE: Non ho trovato nessuna sottocategoria chiamata 'CITIES' o 'CITTÀ'. Assicurati di avere una sottocategoria con questo nome!");
                        }
                    });
                }
            });
        }

        function insertData() {
            if(targetList.some(x => x.name.toUpperCase().includes('SWAKOPMUND'))) {
                alert("Le città sembrano essere già state importate!");
                return;
            }

            citiesData.forEach(c => {
                targetList.push({
                    id: 'it_' + Date.now() + Math.floor(Math.random()*10000),
                    name: c.name,
                    description: c.description,
                    photos: [],
                    facts: c.facts
                });
            });

            window.PARKS_DB.save(dbKey, targetDb, () => {
                alert('Tutte le altre città della Namibia sono state importate con successo! La pagina si ricaricherà.');
                location.reload();
            });
        }
    };

})();
