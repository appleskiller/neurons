import { ArrayRenderer } from "./array";
import { BooleanRenderer } from "./boolean";
import { DateRenderer } from "./date";
import { NumberRenderer } from "./number";
import { SectionRenderer } from "./section";
import { SelectRenderer } from "./select";
import { StringRenderer } from "./string";
import { UnknownRenderer } from "./unknown";

export const renderers = {
    'string': StringRenderer,
    'number': NumberRenderer,
    'date': DateRenderer,
    'boolean': BooleanRenderer,
    'array': ArrayRenderer,
    'select': SelectRenderer,
    'section': SectionRenderer,
    'object': SectionRenderer,

    'unknown': UnknownRenderer,
}

