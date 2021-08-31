# Arguments

```ts
const args = new Arguments();

args.expect(
    ['port', 'p'],
    `HTTP port.`,
    (v?: string | number): number => {
        if (v === undefined) return 8080;

        return parseInt(v.toString());
    }
);


if (args.hasHelp()) {
    console.log(args.getHelpMessage());
}


const options = {
    port: args.get<number>('port'),
}
```