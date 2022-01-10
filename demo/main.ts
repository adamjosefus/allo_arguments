import { join } from "https://deno.land/std@0.120.0/path/mod.ts";
import { Arguments, ValueException } from "../mod.ts";



function init() {
    const configProcessor = (v: string | null): string => {
        if (v == null) throw new ValueException(`Cesta konfiguračního souboru není nastavena. Nastavíte jí pomocí "--config=<path>"`)

        return join(Deno.cwd(), v);
    }


    const sleepProcessor = (v: string | number | null): number | null => {
        if (v === null) return null;
        if (typeof v === "string") v = parseInt(v, 10);

        if (isNaN(v)) throw new ValueException(`Délka pauzy musí platné číslo číslo. "--sleep=<number>"`)
        if (v <= 200) throw new ValueException(`Délka pauzy nesmí být menší než 200 ms. "--sleep=<number>"`)

        return v;
    }

    const booleanProcessor = (v: boolean | string | null) => v === true || v === 'true';


    const args = new Arguments(
        {
            name: 'config, c',
            description: `Cesta na konfigujrační soubor ve formátu JSON.`,
            processor: configProcessor,
            default: 'config.json'
        },
        {
            name: 'clone',
            description: `Příznak pro naklonování repozitářů.`,
            processor: booleanProcessor,
            default: false,
        },
        {
            name: 'pull',
            description: `Příznak pro aktualizaci repozitářů.`,
            processor: booleanProcessor,
            default: false,
        },
        {
            name: 'delete',
            description: `Smaže všechny složky repozitářů podle konfiguračního souboru.`,
            processor: booleanProcessor,
            default: false,
        },
        {
            name: 'sleep, s',
            description: `Délka pauzy mezi procesy v milisekundách.`,
            processor: sleepProcessor,
            default: 5000,
        },
        {
            name: 'pretty-format, prtt',
            description: `Naformátuje seznamy repozitářů do čitelnější podoby. Soubor bude upraven.`,
            processor: booleanProcessor,
            default: false,
        },
        {
            name: 'exitkey',
            processor: booleanProcessor,
            default: true,
        },
    );

    args.setDescription(`Nástroj na naklonování a aktualizaci repozitářů.`)
    args.setVersion('v1.0.0');


    // Help
    if (args.shouldHelp()) args.triggerHelpException();


    const values = {
        config: args.get<string>('config'),
        clone: args.get<boolean>('clone'),
        pull: args.get<boolean>('pull'),
        delete: args.get<boolean>('delete'),
        sleep: args.get<number>('sleep'),
        prettyFormat: args.get<boolean>('pretty-format'),
    }


    console.log(values);
    
}


try {
    await init();
} catch (error) {
    if (!Arguments.isArgumentException(error)) throw error;
}