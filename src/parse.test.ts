/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { assertEquals } from "../libs/deno_std/testing_asserts.ts";
import { parse } from "./parse.ts";


Deno.test("parse", () => {
    assertEquals(parse([]), []);

    assertEquals(parse(["--foo"]), [
        {
            _tag: "Flag",
            name: "foo",
            order: 0,
            short: false,
            value: true,
        },
    ]);

    assertEquals(parse(["--key1=value1", "--key2", "value2"]), [
        {
            _tag: "Flag",
            name: "key1",
            order: 0,
            short: false,
            value: "value1",
        },
        {
            _tag: "Flag",
            name: "key2",
            order: 1,
            short: false,
            value: "value2",
        },
    ]);

    assertEquals(parse(["-a"]), [
        {
            _tag: "Flag",
            name: "a",
            order: 0,
            short: true,
            value: true,
        },
    ]);

    assertEquals(parse(["--yes"]), [
        {
            _tag: "Flag",
            name: "yes",
            order: 0,
            short: false,
            value: true,
        },
    ]);

    assertEquals(parse(["--no-yes"]), [
        {
            _tag: "Flag",
            name: "no-yes",
            order: 0,
            short: false,
            value: true,
        },
    ]);
});
