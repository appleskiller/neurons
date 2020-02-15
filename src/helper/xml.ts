
import { Parser } from 'htmlparser2/lib/Parser'

export enum XMLASTNodeType {
    'ROOT' = 1, // root node
    'DIRECTIVE' = 2, // <?xml or <!DOCTYPE or others
    'TAG' = 3,
    'TEXT' = 4,
    'COMMENT' = 5,
}
export interface IXMLASTNode {
    type: XMLASTNodeType;
    startIndex: number;
    endIndex: number;
    name?: string;
    parentNode?: IXMLASTNode;
    childNodes?: IXMLASTNode[];
    attrs?: { [key: string]: string };
    content?: string;
    xmlns?: string;
}
/**
 * Parses xml
 * @param content 
 * @param [hifi] High Fidelity. default false.
 * @returns IXMLASTNode 
 */
export function parseXML(content: string, hifi: boolean = false): IXMLASTNode {
    content = content || '';
    const result: IXMLASTNode = {
        type: XMLASTNodeType.ROOT,
        startIndex: 0,
        endIndex: content.length - 1,
        childNodes: []
    };
    let parent = result;
    let current;
    let underSVGNamespacing = false;
    const parser = new Parser({
        onprocessinginstruction: function (name, data) {
            if (hifi) {
                current = {
                    type: XMLASTNodeType.DIRECTIVE,
                    startIndex: parser.startIndex,
                    endIndex: parser.endIndex,
                    name: name,
                    content: data,
                    parentNode: parent,
                }
                parent.childNodes.push(current);
            }
        },
        onopentag: function (name, attribs) {
            let attrs = attribs || {};
            if (!hifi) {
                attrs = {};
                Object.keys(attribs).forEach(key => {
                    const value = attribs[key];
                    key = key.trim();
                    if (key) {
                        attrs[key] = value.trim();
                    }
                })
            }
            current = {
                type: XMLASTNodeType.TAG,
                startIndex: parser.startIndex,
                endIndex: parser.endIndex,
                name: name,
                parentNode: parent,
                attrs: attrs,
                childNodes: []
            }
            if (name === 'svg') {
                current.xmlns = attrs.xmlns || parent.xmlns || 'http://www.w3.org/2000/svg';
            } else {
                parent.xmlns && (current.xmlns = parent.xmlns)
            }
            parent.childNodes.push(current);
            // enter
            parent = current;
        },
        onclosetag: function () {
            // exit
            parent = parent.parentNode;
        },
        // onattribute: function(name, value){
        //     // console.log("-->", text);
        //     parser
        // },
        ontext: function (text) {
            if (!hifi) {
                text = text.trim();
                if (!text) return;
            }
            current = {
                type: XMLASTNodeType.TEXT,
                startIndex: parser.startIndex,
                endIndex: parser.endIndex,
                parentNode: parent,
                content: text,
            }
            parent.childNodes.push(current);
        },
        oncomment: function (data) {
            if (hifi) {
                current = {
                    type: XMLASTNodeType.COMMENT,
                    startIndex: parser.startIndex,
                    endIndex: parser.endIndex,
                    parentNode: parent,
                    content: data,
                }
                parent.childNodes.push(current);
            }
        },
        // oncommentend: function () {
        //     parser
        // },
        oncdatastart: function () {
            let cdata = '';
            if (hifi) {
                cdata = content.substring(parser.startIndex, parser.endIndex);
            } else {
                const startIndex = parser.startIndex + 9;
                const endIndex = parser.endIndex - 2;
                cdata = content.substring(startIndex, endIndex).trim();
                if (!cdata) return;
            }
            current = {
                type: XMLASTNodeType.TEXT,
                startIndex: parser.startIndex,
                endIndex: parser.endIndex,
                parentNode: parent,
                content: cdata,
            }
            parent.childNodes.push(current);
        },
        // oncdataend: function () {
        //     parser
        // },
        onerror: function (error) {
            throw error;
        },
        // onend: function() {

        // }
    }, {
        decodeEntities: true,
        recognizeCDATA: true,
        recognizeSelfClosing: true,
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
    });
    parser.write(content);
    parser.end();
    return result;
}
