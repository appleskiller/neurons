
// https://tools.ietf.org/html/rfc7946#section-6

// -----------------------------------------------------------------------
// bbox
// =======================================================================
export function isValidFeatureBBox(bbox): boolean {
    return bbox && bbox.length === 4;
}
export function getBBoxCenter(bbox): number[] {
    if (isValidFeatureBBox(bbox)) {
        const width = bbox[2] - bbox[0];
        const height = bbox[3] - bbox[1];
        return [bbox[0] + width / 2, bbox[1] + height / 2];
    }
    return null;
}
export function unionFeatureBBox(bbox1: number[], bbox2: number[]) {
    bbox1 = bbox1 || [];
    bbox2 = bbox2 || [];
    if (bbox1.length !== 4 && bbox2.length !== 4) {
        return [];
    } else if (bbox1.length === 4 && bbox2.length !== 4) {
        return bbox1.concat();
    } else if (bbox1.length !== 4 && bbox2.length === 4) {
        return bbox2.concat();
    } else {
        return [
            Math.min(bbox1[0], bbox2[0], bbox1[2], bbox2[2]),
            Math.min(bbox1[1], bbox2[1], bbox1[3], bbox2[3]),
            Math.max(bbox1[0], bbox2[0], bbox1[2], bbox2[2]),
            Math.max(bbox1[1], bbox2[1], bbox1[3], bbox2[3]),
        ]
    }
}

// point
function collectPoint(coordinate, bbox) {
    bbox = bbox || [];
    if (coordinate.length === 2) {
        const x = coordinate[0];
        const y = coordinate[1];
        if (bbox[0] === undefined) {
            bbox[0] = bbox[2] = x;
            bbox[1] = bbox[3] = y;
        } else {
            bbox[0] = Math.min(x, bbox[0]);
            bbox[2] = Math.max(x, bbox[2]);
            bbox[1] = Math.min(y, bbox[1]);
            bbox[3] = Math.max(y, bbox[3]);
        }
    }
}
// line | multi point
function collectPoints(coordinates, bbox) {
    bbox = bbox || [];
    if (coordinates && coordinates.length) {
        for (let i = 0; i < coordinates.length; i++) {
            collectPoint(coordinates[i], bbox);
        }
    }
    return bbox;
}
// polygons | multi line
function collectPolygons(coordinates, bbox) {
    bbox = bbox || [];
    if (coordinates && coordinates.length) {
        for (let i = 0; i < coordinates.length; i++) {
            collectPoints(coordinates[i], bbox);
        }
    }
    return bbox;
}

// multi polygons
function collectMultiPolygons(coordinates, bbox) {
    bbox = bbox || [];
    if (coordinates && coordinates.length) {
        for (let i = 0; i < coordinates.length; i++) {
            collectPolygons(coordinates[i], bbox);
        }
    }
    return bbox;
}

function calcGeometryCollection(geometry, bbox) {
    bbox = bbox || [];
    if (geometry && geometry.geometries) {
        for (let index = 0; index < geometry.geometries.length; index++) {
            calcGeometry(geometry.geometries[index], bbox);
        }
    }
    return bbox;
}

function calcGeometry(geometry, bbox) {
    bbox = bbox || [];
    if (geometry) {
        switch (geometry.type) {
            case 'Point':
                collectPoint(geometry.coordinates, bbox);
                break;
            case 'MultiPoint':
            case 'LineString':
                collectPoints(geometry.coordinates, bbox);
                break;
            case 'MultiLineString':
            case 'Polygon':
                collectPolygons(geometry.coordinates, bbox);
                break;
            case 'MultiPolygon':
                collectMultiPolygons(geometry.coordinates, bbox);
                break;
            case 'GeometryCollection':
                calcGeometryCollection(geometry.coordinates, bbox);
                break;
            default:
                break;
        }
    }
    return bbox;
}

function fixFeatureBBox(feature) {
    if (feature) {
        if (!feature.bbox) {
            const box = calcGeometryBBox(feature.geometry);
            if (box && box.length === 4) {
                feature.bbox = box;
            }
        }
        return feature.bbox;
    }
    return null;
}

function fixFeatureCollectionBBox(geojson) {
    if (geojson.features) {
        geojson.bbox = [];
        for (let i = 0; i < geojson.features.length; i++) {
            const bbox = fixFeatureBBox(geojson.features[i]);
            geojson.bbox = unionFeatureBBox(geojson.bbox, bbox);
        }
        return geojson.bbox;
    }
    return null;
}

export function calcGeometryBBox(geometry): number[] {
    return calcGeometry(geometry, []);
}

export function fixGeoJsonBBox(geojson: any) {
    if (geojson) {
        if (geojson.type === 'FeatureCollection') {
            fixFeatureCollectionBBox(geojson);
        } else if (geojson.type === 'Feature') {
            fixFeatureBBox(geojson);
        }
    }
    return geojson;
}

export function getAndFixFeatureBBox(feature) {
    feature = fixGeoJsonBBox(feature);
    if (feature) {
        return feature.bbox;
    }
    return [];
}

function getFeatureName(feature) {
    if (feature && feature.properties) {
        return feature.properties.name;
    } else {
        return '';
    }
}

export function getFeatureFromGeoJson(name, geojson) {
    if (!name || !geojson) return null;
    if (geojson.type === 'Feature') {
        if (getFeatureName(geojson) === name) {
            return geojson;
        } else {
            return null;
        }
    } else if (geojson.type == 'FeatureCollection') {
        if (geojson.features) {
            return geojson.features.find(feature => (getFeatureName(feature) === name));
        }
    }
}

export function fixToGeoJson(geojson, bbox) {
    if (geojson && isValidFeatureBBox(bbox)) {
        const geoBox = getAndFixFeatureBBox(geojson);
        if (isValidFeatureBBox(geoBox)) {
            const center = getBBoxCenter(bbox);
            const width = bbox[2] - bbox[0];
            const height = bbox[3] - bbox[1];
            const geoWidth = geoBox[2] - geoBox[0];
            const geoHeight = geoBox[3] - geoBox[1];
            let zoom = Math.floor(Math.min(geoWidth / width, geoHeight / height));
            return {
                center: center,
                zoom: zoom
            };
        }
    }
    return null;
}