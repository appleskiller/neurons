import { IJSENode, IJSERoot, IJSONSchema, IPropertiesSchema, IPropertySchema } from "./interfaces";
import { isDefined, isEmpty } from "neurons-utils";

export function createJSERoot(schema: IJSONSchema) {
    const root = {
        schema: schema,
        children: [],
    };
    root.children = createJSEPropertiesNodes(schema, root, root, '', '', 0);
    return root;
}

export function createJSEPropertiesNodes(
    schema: IJSONSchema | IPropertySchema,
    root: IJSERoot,
    parent: IJSENode | IJSERoot,
    parentPointer: string,
    parentSchemaPointer: string,
    depth: number
): IJSENode[] {
    const properties = schema ? schema.properties : null
    if (properties && !isEmpty(properties)) {
        return Object.keys(properties).filter(key => properties[key] && !properties[key].hidden).map((key, index) => {
            const schema = properties[key];
            const node: IJSENode = {
                schema: schema,
                property: key,
                index: index,
                depth: depth,

                pointer: parentPointer ? `${parentPointer}.${key}` : `${key}`,
                schemaPointer: parentSchemaPointer ? `${parentSchemaPointer}.properties.${key}` : `properties.${key}`,

                root: root,
                parent: parent,
            };
            return node;
        }).sort((a, b) => (a.schema.order || 0) - (b.schema.order || 0));
    } else {
        return [];
    }
}

export function createJSEItemsNodes(
    data: any[],
    schema: IJSONSchema | IPropertySchema,
    root: IJSERoot,
    parent: IJSENode | IJSERoot,
    parentPointer: string,
    parentSchemaPointer: string,
    depth: number
): IJSENode[] {
    if (!data || !data.length) return [];
    const items = schema ? schema.items : null;
    if (items && !isEmpty(items)) {
        return data.map((value, index) => {
            return this.createJSEItemsNode(index, items, root, parent, parentPointer, parentSchemaPointer, depth);
        })
    } else {
        return [];
    }
}

export function createJSEItemsNode(
    index: number,
    itemSchema: IPropertySchema,
    root: IJSERoot,
    parent: IJSENode | IJSERoot,
    parentPointer: string,
    parentSchemaPointer: string,
    depth: number
): IJSENode {
    return {
        schema: itemSchema,
        property: index + '',
        index: index,
        depth: depth,

        pointer: parentPointer ? `${parentPointer}.${index}` : `${index}`,
        schemaPointer: parentSchemaPointer ? `${parentSchemaPointer}.items` : `items`,

        root: root,
        parent: parent,
    }
}

export function updateJSEItemsNodeIndex(node: IJSENode, parentPointer: string, newIndex: number): IJSENode {
    if (isDefined(newIndex)) {
        node.property = newIndex + '';
        node.pointer = parentPointer ? `${parentPointer}.${newIndex}` : `${newIndex}`;
    }
    return node;
}
