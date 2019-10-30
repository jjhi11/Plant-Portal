require([
    // ArcGIS
    "esri/Map",
    "esri/views/MapView",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/layers/GraphicsLayer",
    "esri/widgets/Sketch/SketchViewModel",
    "esri/Graphic",
    //Layers
    "esri/layers/FeatureLayer",
    //Tasks  
    "esri/tasks/support/Query",
    "esri/tasks/QueryTask",
    // Widgets
    "esri/widgets/Home",
    "esri/widgets/Zoom",
    "esri/widgets/Compass",
    "esri/widgets/Search",
    "esri/widgets/Legend",
    "esri/widgets/BasemapToggle",
    "esri/core/watchUtils",
    "esri/tasks/support/RelationshipQuery",
    "esri/popup/content/AttachmentsContent",

    // Bootstrap
    "bootstrap/Collapse",
    "bootstrap/Dropdown",

    // Dojo
    "dojo/query",
    "dojo/store/Memory",
    "dojo/data/ObjectStore",
    "dojo/data/ItemFileReadStore",
    "dojox/grid/DataGrid",
    "dgrid/OnDemandGrid",
    "dgrid/extensions/ColumnHider",
    "dgrid/Selection",
    "dstore/legacy/StoreAdapter",
    "dgrid/List",
    "dojo/_base/declare",
    "dojo/request",
    "dojo/mouse",

    // Calcite Maps
    "calcite-maps/calcitemaps-v0.9",

    // Calcite Maps ArcGIS Support
    "calcite-maps/calcitemaps-arcgis-support-v0.10",
    "dojo/on",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/domReady!"
], function(Map, MapView, SimpleMarkerSymbol, GraphicsLayer, SketchViewModel, Graphic, FeatureLayer, Query, QueryTask, Home, Zoom, Compass, Search, Legend, BasemapToggle, watchUtils, RelationshipQuery, AttachmentsContent, Collapse, Dropdown, query, Memory, ObjectStore, ItemFileReadStore, DataGrid, OnDemandGrid, ColumnHider, Selection, StoreAdapter, List, declare, request, mouse, CalciteMaps, CalciteMapArcGISSupport, on, arrayUtils, dom, domClass, domConstruct) {

    /******************************************************************
     *
     * Create the map, view and widgets
     * 
     ******************************************************************/

    let grid;

    let type1 = "All";
    let type2 = "All";
    let type3 = "All";
    let type4 = "All";

    sitesCount = 0;

    // create a new datastore for the on demandgrid
    // will be used to display attributes of selected features
    let dataStore = new StoreAdapter({
        objectStore: new Memory({
            idProperty: "OBJECTID"
        })
    });

    // let gridFields = ["project", "huc8", "siteCode", "ecoSystem",
    //     "hgmClass", "wetlandType", "wetlandCondition", "coverMethod", "surveyDate"
    // ];

    let speciesFields = ["OBJECTID", "species", "commonName", "growthForm", "nativity",
        "finalIndicator", "cover", "collection"
    ];

    let skecthViewModel;
    let polygonGraphicsLayer;
    let highlight;


    const gridDis = document.getElementById("gridDisplay");

    // Defines an action to open species related to the selected feature
    var speciesAction = {
        title: "Species Found at Site",
        id: "related-species",
        className: "esri-icon-table"
    };







    contentSites = function(feature) {
        var content = "";

            if (feature.graphic.attributes.siteCode) {
                content += "<span class='bold' title='Site Code'><b>Site Code: </b></span>{siteCode}<br/>";
            }
            if (feature.graphic.attributes.surveyDate) {
                console.log(feature.graphic.attributes.surveyDate);
                const date = moment(feature.graphic.attributes.surveyDate).format('ll');
                content += "<span class='bold' title='Survey Date'><b>Survey Date: </b></span>{surveyDate}<br/>";
            }
            if (feature.graphic.attributes.coverMethod) {
                content += "<span class='bold' title='Site Code'><b>Cover Method: </b></span>{coverMethod}<br/>";
            }
            if (feature.graphic.attributes.Organization) {
                content += "<span class='bold' title='Organization'><b>Organization: </b></span>{Organization}<br/>";
            }
            if (feature.graphic.attributes.ecoSystem) {
                content += "<span class='bold' title='Ecological System'><b>Ecological System: </b></span>{ecoSystem}<br/>";
            }
            if (feature.graphic.attributes.hgmClass) {
                content += "<span class='bold' title='HGM Class'><b>HGM Class: </b></span>{hgmClass}<br/>";
            }
            if (feature.graphic.attributes.siteCode) {
                content += "<span class='bold' title='Wetland Type'><b>Wetland Type: </b></span>{wetlandType}<br/>";
            }
            if (feature.graphic.attributes.wetlandCondition) {
                content += "<span class='bold' title='Wetland Condition'><b>Wetland Condition: </b></span>{wetlandCondition}<br/>";
            }
            if (feature.graphic.attributes.conditionMethod) {
                content += "<span class='bold' title='Condition Method'><b>Condition Method: </b></span>{conditionMethod}<br/>";
            }
        return content;
    }

    var pointSymbol = {
        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
        color: "yellow",
        size: "8px",
        outline: { // autocasts as new SimpleLineSymbol()
            color: "black",
            width: 0.3
        }
    };

    var renderSite = {
        type: "simple", // autocasts as new SimpleRenderer()
        symbol: pointSymbol,
    };

    let plantLayerView;

    var plantSites = new FeatureLayer({
        url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalTestV3_View/FeatureServer",
        title: "Plant Sites",
        visibile: true,
        outFields: ["*"],
        //outFields: ["huc8", "wetlandType"],
        popupTemplate: {
            title: "Plant Sites",
            actions: [speciesAction],
            content: [{
                    type: "fields",
                    fieldInfos: [{
                        fieldName: "siteCode",
                             visible: false,
                             label: "Site Code" 
                    },
                    {
                        fieldName: "surveyDate",
                             visible: false,
                             label: "Survey Date" 
                    },
                    {
                        fieldName: "coverMethod",
                             visible: false,
                             label: "Cover Method" 
                    },
                    {
                        fieldName: "Organization",
                             visible: false,
                             label: "Organization" 
                    },
                    {
                        fieldName: "ecoSystem",
                             visible: false,
                             label: "Ecological System" 
                    },
                    {
                        fieldName: "hgmClass",
                             visible: false,
                             label: "HGM Class" 
                    },
                    {
                        fieldName: "wetlandType",
                             visible: false,
                             label: "Wetland Type" 
                    },
                    {
                        fieldName: "wetlandCondition",
                             visible: false,
                             label: "Wetland Condition" 
                    },
                    {
                        fieldName: "conditionMethod",
                             visible: false,
                             label: "Condition Method" 
                    }
                    ]
            },
                    {
                    type: "text",
                    text: "<b>Site Code: </b>{siteCode}<br><b>Survey Date: </b>{surveyDate}<br><b>Cover Method: </b>{coverMethod}<br><b>Organization: </b>{Organization}<br><b>Ecological System: </b>{ecoSystem}<br><b>HGM Class: </b>{hgmClass}<br><b>Wetland Type: </b>{wetlandType}<br><b>Wetland Condition: </b>{wetlandCondition}<br><b>Condition Method: </b>{conditionMethod}<br>"
                },
                {
                    type: "attachments"
                }
                ]
            //content: contentSites
        },
        elevationInfo: [{
            mode: "on-the-ground"
        }],
        renderer: renderSite
    });


    var sitesSpeciesJoin = new FeatureLayer({
        url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/siteSpeciesJoin/FeatureServer",
        // title: "Plant Sites",
        // visibile: true,
        outFields: ["*"],
        // outFields: ["huc8", "wetlandType"],
        // popupTemplate: {
        //     title: "Plant Sites",
        //     actions: [speciesAction],
        //     content: "{siteCode:contentSites}{surveyDate:contentSites}{coverMethod:contentSites}{Organization:contentSites}{ecoSystem:contentSites}{hgmClass:contentSites}{wetlandType:contentSites}{wetlandCondition:contentSites}{conditionMethod:contentSites}"
        // },
        // elevationInfo: [{
        //     mode: "on-the-ground"
        // }],
        // renderer: renderSite
    });


    // Map
    var map = new Map({
        basemap: "hybrid",
        layers: [plantSites],
        //ground: "world-elevation",
    });

    // View
    var mapView = new MapView({
        container: "mapViewDiv",
        map: map,
        center: [-112, 40.7],
        zoom: 11,
        highlightOptions: {
            color: "#2B65EC",
            fillOpacity: 0.4
        },
        // padding: {
        //   top: 50,
        //   bottom: 0
        // },
        ui: {
            components: []
        }
    });

    // Popup and panel sync
    mapView.when(function() {
        CalciteMapArcGISSupport.setPopupPanelSync(mapView);
    });
    // Search - add to navbar
    var searchWidget = new Search({
        container: "searchWidgetDiv",
        view: mapView
    });
    CalciteMapArcGISSupport.setSearchExpandEvents(searchWidget);

    // Map widgets
    var home = new Home({
        view: mapView
    });
    mapView.ui.add(home, "top-left");
    var zoom = new Zoom({
        view: mapView
    });
    mapView.ui.add(zoom, "top-left");
    var compass = new Compass({
        view: mapView
    });
    mapView.ui.add(compass, "top-left");

    var basemapToggle = new BasemapToggle({
        view: mapView,
        secondBasemap: "satellite"
    });

    // Panel widgets - add legend
    var legendWidget = new Legend({
        container: "legendDiv",
        view: mapView
    });

    //uses featureLayer.filter to filter out confidential sites. Only visually though.
    mapView.whenLayerView(plantSites).then(function(layerView) {
        plantLayerView = layerView;
        plantLayerView.filter = {
            where: "confidential = 0"
        };
    });

    function errorCallback(error) {
        console.log("error:", error);
    }


    /****************************************************
     * Selects features from the csv layer that intersect
     * a polygon that user drew using sketch view model
     ****************************************************/
    function selectFeatures(geometry) {
        mapView.graphics.removeAll();

        // create a query and set its geometry parameter to the
        // polygon that was drawn on the view
        var query = {
            geometry: geometry,
            outFields: ["OBJECTID", "project", "huc8", "siteCode", "ecolevel3", "ecolevel4", "ecoSystem", "surveyDate", "hgmClass", "wetlandType", "wetlandCondition", "coverMethod", "confidential"]
        };

        // query graphics from the csv layer view. Geometry set for the query
        // can be polygon for point features and only intersecting geometries are returned
        plantLayerView
            .queryFeatures(query)
            .then(function(results) {
                gridFields = ["OBJECTID", "project", "surveyDate", "huc8", "siteCode", "ecoSystem",
                    "hgmClass", "wetlandType", "wetlandCondition", "coverMethod"
                ];
                console.log(results);
                resultsArray = results.features;
                var graphics = results.features;
                // if the grid div is displayed while query results does not
                // return graphics then hide the grid div and show the instructions div
                if (graphics.length > 0) {
                    // zoom to the extent of the polygon with factor 2
                    mapView.goTo(geometry.extent.expand(2));

                }

                console.log(results);
                console.log(graphics);
                getResults(results);


                // remove existing highlighted features
                if (highlight) {
                    highlight.remove();
                }

                // highlight query results
                highlight = plantLayerView.highlight(graphics);

            })
            .catch(errorCallback);

    }

    // create a new sketchviewmodel, setup it properties
    // set up the click event for the select by polygon button
    setUpSketchViewModel();
    sketchViewModel.on("create", function(event) {
        if (event.state === "complete") {
            // this polygon will be used to query features that intersect it
            polygonGraphicsLayer.remove(event.graphic);
            console.log(event);
            selectFeatures(event.graphic.geometry);
        }
    });

    // function errorCallback(error) {
    //   console.log("error:", error);
    // }

    /************************************************************************
     * Sets up the sketchViewModel. When user clicks on the select by polygon
     * button sketchViewModel.create() method is called with polygon param.
     ************************************************************************/
    function setUpSketchViewModel() {
        // polygonGraphicsLayer will be used by the sketchviewmodel
        // show the polygon being drawn on the view
        polygonGraphicsLayer = new GraphicsLayer();
        mapView.map.add(polygonGraphicsLayer);

        // add the select by polygon button the view
        mapView.ui.add("select-by-polygon", "top-left");
        const selectButton = document.getElementById("select-by-polygon");

        // click event for the button
        selectButton.addEventListener("click", function() {
            doClear();
            mapView.popup.close();
            // ready to draw a polygon
            sketchViewModel.create("polygon");
        });

        // create a new sketch view model set its layer
        sketchViewModel = new SketchViewModel({
            view: mapView,
            layer: polygonGraphicsLayer,
            pointSymbol: {
                type: "simple-marker",
                color: [255, 255, 255, 0],
                size: "1px",
                outline: {
                    color: "gray",
                    width: 0
                }
            }
        });
    }



    // create grid
    function createGrid(fields) {
        console.log("creating grid");
        console.log(fields);
        console.log(gridFields);


        var columns = fields.filter(function(field, i) {
            if (gridFields.indexOf(field.name) >= -1) {
                return field;
            }
        }).map(function(field) {
            //console.log(field);
            if (field.name == "OBJECTID") {
                console.log("HIDE COLUMN " + field.name);
                return {
                    field: field.name,
                    label: field.alias,
                    //sortable: true,
                    hidden: true
                };
            } else {
                console.log("SHOW COLUMN");
                return {
                    field: field.name,
                    label: field.alias,
                    sortable: true
                };
            }


        });

        console.log(columns);

        // create a new onDemandGrid with its selection and columnhider
        // extensions. Set the columns of the grid to display attributes
        // the hurricanes cvslayer
        grid = new(declare([OnDemandGrid, Selection]))({
            columns: columns
        }, "grid");

        // add a row-click listener on the grid. This will be used
        // to highlight the corresponding feature on the view
        grid.on("dgrid-select", selectFeatureFromGrid);
        //console.log(grid.columns[0].field);
        //add tooltips to summary of species table
        if (grid.columns[0].field == "species") {

            console.info("SummarySpecies");
            grid.on("th.field-commonName:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Common Name from USDA Plants";
            });
            grid.on("th.field-species:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Scientific Name from USDA Plants";
            });
            grid.on("th.field-speciesCount:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Number of selected sites where species found (including both public and confidential sites)";
            });
            grid.on("th.field-meanCover:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Mean cover at sites where species was found";
            });
            grid.on("th.field-nativity:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Nativity in Utah";
            });
            grid.on("th.field-noxious:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Noxious status in Utah";
            });
            grid.on("th.field-growthForm:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Growth form";
            });
            grid.on("th.field-indicator:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Wetland indicator rating for Arid West or Western Mountains, Valleys, or Coasts (depending on site locations)";
            });
            grid.on("th.field-finalIndicator:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Wetland indicator rating for Arid West or Western Mountains, Valleys, or Coasts (depending on site locations)";
            });
            grid.on("th.field-cover:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Percent cover at site";
            });

        }

        //add tooltips to sites table
        if (grid.columns[0].field == "huc8") {

            console.info("Sites");
            grid.on("th.field-project:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Project Name";
            });
            grid.on("th.field-huc8:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Watershed";
            });
            grid.on("th.field-siteCode:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Site Code";
            });
            grid.on("th.field-ecoSystem:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "NatureServe's Ecological System";
            });
            grid.on("th.field-surveyDate:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Survey Date";
            });
            grid.on("th.field-hgmClass:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "HGM Class";
            });
            grid.on("th.field-wetlandType:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Wetland Type";
            });
            grid.on("th.field-coverMethod:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Cover Method";
            });
            grid.on("th.field-wetlandCondition:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Wetland Condition";
            });

        }
    }


    function selectFeatureFromGrid(event) {



        console.log(event);
        mapView.popup.close();
        mapView.graphics.removeAll();
        var row = event.rows[0]
        console.log(row);
        var id = row.data.OBJECTID;
        console.log(id);

        // setup a query by specifying objectIds
        //   var query = {
        //     objectIds: [parseInt(id)],
        //     outFields: ["*"],
        //     returnGeometry: true
        //   };

        var query = plantSites.createQuery();

        query.where = "OBJECTID = '" + id + "'";
        query.returnGeometry = true;
        query.outFields = ["*"],

            // query the palntLayerView using the query set above
            plantSites.queryFeatures(query).then(function(results) {
                console.log(results);
                var graphics = results.features;
                console.log(graphics);
                var item = graphics[0];

                //checks to see if site is confidential or not
                if (item.attributes.confidential != 1) {
                    console.log("public");
                    var cntr = [];
                    cntr.push(item.geometry.longitude);
                    cntr.push(item.geometry.latitude);
                    console.log(item.geometry);
                    mapView.goTo({
                        center: cntr, // position:
                        zoom: 13
                    });

                    mapView.graphics.removeAll();
                    var selectedGraphic = new Graphic({

                        geometry: item.geometry,
                        symbol: new SimpleMarkerSymbol({
                            //color: [0,255,255],
                            style: "circle",
                            //size: "8px",
                            outline: {
                                color: [255, 255, 0],
                                width: 3
                            }
                        })
                    });

                    mapView.graphics.add(selectedGraphic);

                    mapView.popup.open({
                        features: [item],
                        location: item.geometry
                    });
                } else {
                    console.log("confidential");

                    //masking confidential sites geographically by adding to their lat long values with a randomly generated number between min and max variables
                    var min = .003;
                    var max = .05;
                    var random = Math.random() * (+max - +min) + +min;
                    maskedLat = item.geometry.latitude + random;
                    maskedLong = item.geometry.longitude - random;
                    var cntr = [];
                    cntr.push(maskedLong);
                    cntr.push(maskedLat);
                    item.geometry.latitude = maskedLat;
                    item.geometry.longitude = maskedLong;
                    console.log(cntr);

                    mapView.goTo({
                        center: cntr, // position:
                        zoom: 13
                    });

                    mapView.graphics.removeAll();
                    var selectedGraphic = new Graphic({

                        geometry: item.geometry,
                        // symbol: new SimpleMarkerSymbol({
                        //     //color: [0,255,255],
                        //     style: "circle",
                        //     //size: "8px",
                        //     outline: {
                        //         color: [255, 255, 0],
                        //         width: 3
                        //     }
                        // })
                    });

                    mapView.graphics.add(selectedGraphic);

                    mapView.popup.open({
                        features: [item],
                        location: cntr
                    });
                }
            })
            .catch(errorCallback)
    }




    var fillSymbol = {
        type: "simple-fill", // autocasts as new SimpleMarkerSymbol()
        color: [242, 196, 238, 0],
        style: "solid",
        outline: { // autocasts as new SimpleLineSymbol()
            color: [243, 124, 124, 0.69],
            width: 1.3
        }
    };


    var renderHuc = {
        type: "simple", // autocasts as new SimpleRenderer()
        symbol: fillSymbol,
    };




    var hucLayer = new FeatureLayer({
        url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalTestV3_View/FeatureServer/1",
        title: "HUCs",
        visibile: true,
        popupTemplate: {
            title: "<b>Watersheds</b>",
            content: [{
                    type: "fields",
                    fieldInfos: [{
                        fieldName: "Name",
                             visible: false,
                             label: "Name" 
                    },
                    {
                        fieldName: "HUC8",
                             visible: false,
                             label: "ID" 
                    }]
            },
                    {
                    type: "text",
                    text: "<b>Name: </b>{Name}<br><b>HUC ID: </b>{HUC8}"
                }
                ]
        },
        renderer: renderHuc
    });


    mapView.map.add(hucLayer);

    mapView.popup.dockOptions = {
        // Disable the dock button so users cannot undock the popup
        buttonEnabled: false,

    };


    function getResults(response) {
        doSpeciesClear();
        

        console.log("getResults");
        console.log(response);
        console.log(response.fields);
        let graphics = response.features;
        console.log(graphics);
        console.log(sitesCount);


        gridDis.style.display = 'block';
        domClass.add("mapViewDiv");
            if (sitesCount > 0) {
                console.log("We have" + sitesCount + "sites");
                document.getElementById("featureCount").innerHTML = "<b>Showing attributes for " + graphics.length.toString() + " features at " + sitesCount + " sites</b>"
            } else {
                document.getElementById("featureCount").innerHTML = "<b>Showing attributes for " + graphics.length.toString() + " features</b>"
            }
            document.getElementById("removeX").setAttribute("class", "glyphicon glyphicon-remove");
            document.getElementById("removeX").setAttribute("style", "float: right;");



console.log("go on and create grid");

        createGrid(response.fields);
        console.log(response.fields);
        console.log(graphics[0].attributes);
        if (graphics[0].attributes) {
            console.log("has attributes");
            // get the attributes to display in the grid
            var data = graphics.map(function(feature, i) {
                return Object.keys(feature.attributes)
                    .filter(function(key) {
                        // get fields that exist in the grid
                        return (gridFields.indexOf(key) !== -1);
                    })
                    // need to create key value pairs from the feature
                    // attributes so that info can be displayed in the grid
                    .reduce((obj, key) => {
                        obj[key] = feature.attributes[key];
                        return obj;
                    }, {});
            });
            console.log(data);

        } else {
            console.log("no attributes");
            var data = graphics;
        }


        //add the counts to the summaryArray
        for (var i = 0; i < data.length; i++) {
            var dateString = moment(data[i].surveyDate).format('l');
            data[i].surveyDate = dateString;
        }

        // set the datastore for the grid using the
        // attributes we got for the query results
        dataStore.objectStore.data = data;
        console.log(dataStore.objectStore.data);
        grid.set("collection", dataStore);

        //document.getElementById("downloadCSV").innerHTML =
        document.getElementById("downloadX").setAttribute("class", "glyphicon glyphicon-download-alt");
        //document.getElementById("downloadX").setAttribute("style", "float: right;");
        //"<a href='#' onclick='downloadCSV({ filename: 'stock-data.csv' });'>Download Table</a>"    




    }

    document.getElementById("downloadX").addEventListener("click", function(evt) {

        //download array to csv functions

        function convertArrayToCSV(args) {
            console.log(args);

            var downloadArray = args.data;
            //delete OBJECTID from the download array
            downloadArray.forEach(function(keytv){
                delete keytv.OBJECTID;
            })

console.log(downloadArray);
            var result, ctr, keys, columnDelimiter, lineDelimiter, data;

            data = args.data || null;
            if (data == null || !data.length) {
                return null;
            }

            columnDelimiter = args.columnDelimiter || ',';
            lineDelimiter = args.lineDelimiter || '\n';

            keys = Object.keys(data[0]);

            result = '';
            result += keys.join(columnDelimiter);
            result += lineDelimiter;

            data.forEach(function(item) {
                ctr = 0;
                keys.forEach(function(key) {
                    if (ctr > 0) result += columnDelimiter;

                    result += item[key];
                    ctr++;
                });
                result += lineDelimiter;
            });

            return result;
        }


        var data, filename, link;
        //console.log(args);

        var csv = convertArrayToCSV({
            data: dataStore.objectStore.data
        });
        if (csv == null) return;

        filename = 'ExportTable.csv';

        if (!csv.match(/^data:text\/csv/i)) {
            csv = 'data:text/csv;charset=utf-8,' + csv;
        }
        data = encodeURI(csv);

        link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();


    })



    //get elements from the dom      
    var waterShedSelect = document.getElementById("waterShed");
    //var hgmSelect = document.getElementById("hgmClass");
    var typeSelect = document.getElementById("wetlandType");
    var conditionSelect = document.getElementById("wetlandCondition");
    var speciesSelect = document.getElementById("speciesText");



    //Query Widget Panels

    // query the species layer for commonName values
    mapView.when(function() {
            return plantSites.when(function() {
                var typeQuery = new Query();
                typeQuery.where = "1=1";
                typeQuery.outFields = ["OBJECTID"];
                //typeQuery.returnDistinctValues = true;
                //typeQuery.orderByFields = ["wetlandType"];
                return plantSites.queryFeatures(typeQuery);
            });

        }).then(speciesRelationshipQuery)


        //}).then(addToSelectSpecies)
        .otherwise(queryError);

    function queryError(error) {
        console.error(error);
    }

    //relationshipQuery for species query dropdown
    function speciesRelationshipQuery(values) {
        var idArray = [];
        var oldArray = values["features"];
        oldArray.forEach(function(ftrs) {

            var att = ftrs.attributes.OBJECTID;

            idArray.push(att);
        });
        var querySpecies = new QueryTask({
            url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/ArcGIS/rest/services/plantPortalTestV3_View/FeatureServer/0"
        });

        var speciesRelateQuery = new RelationshipQuery({
            objectIds: idArray,
            outFields: ["species"],
            //returnGeometry: true,
            relationshipId: 0
        });

        querySpecies.executeRelationshipQuery(speciesRelateQuery).then(function(rslts) {
            var formatArray = [];
            var newArray = Object.values(rslts);

            newArray.forEach(function(ftr) {
                var ott = ftr.features;

                formatArray.push(ott);
            });
            var namesArray = [];
            formatArray.forEach(function(names) {
                names.forEach(function(et) {
                    var poop = et.attributes.species;
                    namesArray.push(poop);
                })
            });


            var arrUnique = namesArray.filter(function(item, index) {
                return namesArray.indexOf(item) >= index;
            });

            arrUnique.sort();
            return (arrUnique);
        }).then(addToSelectSpecies);


    }

    // Add the unique values to the species select element.
    function addToSelectSpecies(values) {

        var filtered = values.filter(function(el) {
            return el != null;
        });


        var input = document.getElementById("speciesText");



        var awesome = new Awesomplete(input, {
            list: filtered,
            minChars: 2,
            autoFirst: true,
            maxItems: 10
        });
        //awesome.list = values;


        // var option = domConstruct.create("option");
        // option.text = "All";
        // typeSelect.add(option);

        // values.forEach(function(value) {
        //     var option = domConstruct.create("option");
        //     option.text = value;
        //     speciesSelect.add(option);
        // });
        // typeSelect.remove(1);
    }

    // query the plantSites layer for wetlandType values

    query(".calcite-panels .panel .panel-collapse").on("show.bs.collapse", function() {
        console.log("Query Panel Open");

        var querySpecies = new QueryTask({
            url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/ArcGIS/rest/services/plantPortalTestV3_View/FeatureServer/0"
        });

        // var typeQuery = new Query();
        // typeQuery.where = "1=1";
        // typeQuery.outFields = ["wetlandType"];
        // typeQuery.returnDistinctValues = true;

        // querySpecies.execute(typeQuery).then(function(typeRslts) {
        //     addToSelect(typeRslts);
        // })

        // var shedQuery = new Query();
        // shedQuery.where = "1=1";
        // shedQuery.outFields = ["huc8"];
        // shedQuery.returnDistinctValues = true;

        // querySpecies.execute(shedQuery).then(function(shedRslts) {
        //     addToSelect2(shedRslts);
        // })

        var ecoQuery = new Query();
        ecoQuery.where = "1=1";
        ecoQuery.outFields = ["ecolevel3"];
        ecoQuery.returnDistinctValues = true;

        querySpecies.execute(ecoQuery).then(function(ecoRslts) {
            console.log(ecoRslts);
            addToEcoLevel(ecoRslts);
        })

        // var conditionQuery = new Query();
        // conditionQuery.where = "1=1";
        // conditionQuery.outFields = ["wetlandCondition"];
        // conditionQuery.returnDistinctValues = true;

        // querySpecies.execute(conditionQuery).then(function(conditionRslts) {
        //     addToSelect4(conditionRslts);
        // })




    });

   

    // Add the unique values to the wetlandType select element.
    function addToSelect(values) {
        console.log("add to select 1");
        console.log(values);
        //var selectedType = typeSelect.options.selectedIndex;

        // var i;
        // for (i = typeSelect.options.length - 1; i >= 0; i--) {
        //     typeSelect.remove(i);
        // }

        while (typeSelect.options.length > 0)
        typeSelect.remove(0);

        console.log(typeSelect.options);
        console.log(typeSelect.options.length);


        var option = domConstruct.create("option");
        option.text = "All";
        typeSelect.add(option);


        values.features.forEach(function(value) {
            var option = domConstruct.create("option");
            option.text = value.attributes.wetlandType;
            typeSelect.add(option);
        });

        //typeSelect.options.selectedIndex = selectedType;

    }


    // Add the unique values to the huc8 select element.
    function addToSelect2(values) {
        console.log("add to select 2");
        console.log(values);
        var i;
        for (i = waterShedSelect.options.length - 1; i >= 0; i--) {
            waterShedSelect.remove(i);
        }
        var option = domConstruct.create("option");
        option.text = "All";
        waterShedSelect.add(option);

        values.features.forEach(function(value) {
            var option = domConstruct.create("option");
            option.text = value.attributes.huc8;
            waterShedSelect.add(option);
        });
        //waterShedSelect.remove(1);
    }


    //Add the unique values to the ecoLevel select element.
    function addToEcoLevel(values) {
        console.log("add to select eco level");
        console.log(values);
        sitesCount = 0;

        var i;
        for (i = ecoLevel.options.length - 1; i >= 0; i--) {
            ecoLevel.remove(i);
        }
        var option = domConstruct.create("option");
        option.text = "All";
        ecoLevel.add(option);

        values.features.forEach(function(value) {
            console.log("populating drop down");
            var option = domConstruct.create("option");
            option.text = value.attributes.ecoLevel3;
            ecoLevel.add(option);
        });
        //hgmSelect.remove(1);
    }

    // Add the unique values to the wetlandCondition select element.
    function addToSelect4(values) {
        console.log("add to select 4");
        console.log(values);
        var i;
        for (i = conditionSelect.options.length - 1; i >= 0; i--) {
            conditionSelect.remove(i);
        }
        var option = domConstruct.create("option");
        option.text = "All";
        conditionSelect.add(option);

        values.features.forEach(function(value) {
            var option = domConstruct.create("option");
            option.text = value.attributes.wetlandCondition;
            conditionSelect.add(option);
        });


    }



    mapView.when(function() {
        on(dom.byId("queryFunction"), "click", doQuery);
        on(dom.byId("querySpeciesFunction"), "click", doSpeciesQuery);
        on(dom.byId("clrButton"), "click", doClear);
        on(dom.byId("clrSpeciesButton"), "click", doSpeciesClear);
        on(dom.byId("speciesSummary"), "click", doSpeciesSummary);
    });



    function doClear() {
        console.log("doClear");
        sitesCount = 0;
        var weQuery = new Query();
        var hucQuery = new Query();
        var hgmQuery = new Query();
        var conditionQuery = new Query();
        var whatClicked = "";
        //mapView.popup.close();
        plantSites.definitionExpression = "";
        if (grid) {
            dataStore.objectStore.data = {};
            grid.set("collection", dataStore);
        }
        gridDis.style.display = 'none';
        document.getElementById("featureCount2").innerHTML = "";
        domClass.remove("mapViewDiv", 'withGrid');
        mapView.graphics.removeAll();

        // var i;
        // for (i = waterShedSelect.options.length - 1; i >= 0; i--) {
        //     waterShedSelect.remove(i);
        // }

        weQuery.outFields = ["wetlandType"];
        weQuery.returnDistinctValues = true;
        weQuery.orderByFields = ["wetlandType"];
        weQuery.where = "1=1";
        plantSites.queryFeatures(weQuery).then(function(eet) {
            console.log("Wetland Type Values 1=1", eet);
            addToSelect(eet);
        })

        hucQuery.outFields = ["huc8"];
        hucQuery.returnDistinctValues = true;
        hucQuery.orderByFields = ["huc8"];
        hucQuery.where = "1=1";
        plantSites.queryFeatures(hucQuery).then(function(e) {
            addToSelect2(e);
        })

        conditionQuery.outFields = ["wetlandCondition"];
        conditionQuery.returnDistinctValues = true;
        conditionQuery.orderByFields = ["wetlandCondition"];
        conditionQuery.where = "1=1";
        plantSites.queryFeatures(conditionQuery).then(function(ett) {
            addToSelect4(ett);
        })

        typeSelect.selectedIndex = 0;
        waterShedSelect.selectedIndex = 0;
        ecoLevel.selectedIndex = 0;
        conditionSelect.selectedIndex = 0;

        if (highlight) {
            highlight.remove();
        }

    }

    function doGridClear() {
        console.log("doGridClear");
        //mapView.popup.close();
        //plantSites.definitionExpression = "";
        sitesCount = 0
        
        if (grid) {
            dataStore.objectStore.data = {};
            grid.set("collection", dataStore);
        }
        gridDis.style.display = 'none';
        document.getElementById("featureCount2").innerHTML = "";
        domClass.remove("mapViewDiv", 'withGrid');
        //document.getElementById("featureCount2").innerHTML = "";
        //mapView.graphics.removeAll();

        // if (highlight) {
        //           highlight.remove();
        //         }

    }

    function doSpeciesSummaryClear() {
        console.log("doSpeciesSummaryClear");
        //sitesCount = 0;

        if (grid) {
            dataStore.objectStore.data = {};
            grid.set("collection", dataStore);
        }
        gridDis.style.display = 'none';
        document.getElementById("featureCount2").innerHTML = "";
        domClass.remove("mapViewDiv", 'withGrid');

    }

    function doSpeciesClear() {
        console.log("doSpeciesClear");
        //sitesCount = 0;

        if (grid) {
            dataStore.objectStore.data = {};
            grid.set("collection", dataStore);
        }
        gridDis.style.display = 'none';
        domClass.remove("mapViewDiv", 'withGrid');
        plantSites.definitionExpression = "";
        document.getElementById("speciesText").value = "";

    }


    function doSpeciesQuery() {
        console.log("Species Querying");
        plantSites.definitionExpression = "";
        var speciesCommonName = speciesSelect.value;
        console.log(speciesCommonName);

        var speciesQueryTask = new QueryTask({
            url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalTestV3_View/FeatureServer/5",
        });

        //Query the related table for names that match commonName field with the user selected option in the DOM
        var speciesQuery = new Query();
        speciesQuery.outFields = ["*"];
        speciesQuery.where = "species = '" + speciesCommonName + "'";

        speciesQueryTask.execute(speciesQuery).then(function(results) {
            var oldArray = results.features;
            specidArray = [];
            oldArray.forEach(function(ftrs) {

                var att = ftrs.attributes.OBJECTID;

                specidArray.push(att);
            });

            //setup the relationship query with the plantSites featurelayer using the objectIDs from the related table query
            var querySites = new RelationshipQuery({
                objectIds: specidArray,
                outFields: ["*"],
                returnGeometry: true,
                relationshipId: 0,
            });

            speciesQueryTask.executeRelationshipQuery(querySites).then(function(rslts) {
                console.log(rslts);

                var getArray = [];
                //fromat rslts to a defexp string
                var newArray = Object.values(rslts);
                newArray.forEach(function(ftr) {
                    var itt = ftr.features;
                    getArray.push(itt);
                });
                dashArray = [];
                getArray.forEach(function(et) {

                    et.forEach(function(ef) {
                        var eck = ef.attributes.OBJECTID;
                        dashArray.push("OR OBJECTID = '" + eck + "' ");
                    })
                });

                var specDefExp = dashArray.join('');
                var defExp = specDefExp.substring(3);

                console.log(defExp);

                plantSites.definitionExpression = defExp;

                var query = plantSites.createQuery();
                gridFields = ["OBJECTID", "project", "surveyDate", "huc8", "siteCode", "ecoSystem",
                    "hgmClass", "wetlandType", "wetlandCondition", "coverMethod"
                ];
                query.where = defExp;
                query.outFields = ["OBJECTID", "project", "huc8", "siteCode", "ecolevel3", "ecolevel4", "ecoSystem", "surveyDate", "hgmClass", "wetlandType", "wetlandCondition", "coverMethod", "confidential"];

                plantSites.queryFeatures(query).then(function(e) {
                    console.log(e);


                    resultsArray = e["features"];
                    //console.log(resultsArray);          
                    // put our attributes in an object the datagrid can ingest.
                    var srch = {
                        "items": []
                    };
                    resultsArray.forEach(function(ftrs) {

                        var att = ftrs.attributes;

                        srch.items.push(att);
                    });
                    console.log(e);
                    getResults(e);
                });



            });
        });

    }

    function doQuery() {
        mapView.graphics.removeAll()
        mapView.popup.close();
        console.log("doQuery");
        doGridClear();

        gridFields = ["OBJECTID", "huc8", "siteCode", "ecoSystem", "surveyDate",
            "hgmClass", "wetlandType", "wetlandCondition", "coverMethod"
        ];




        var valueOne = typeSelect.options[typeSelect.selectedIndex].value;
        var valueTwo = waterShedSelect.options[waterShedSelect.selectedIndex].value;
        var ecoSelected = ecoLevel.options[ecoLevel.selectedIndex].value;
        var valueFour = conditionSelect.options[conditionSelect.selectedIndex].value;
        var definitionExp = "";
        var ecoDef = "";


        //134
        if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //124 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //234 
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            definitionExp = "huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //123 
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "'";
        }
        //14
        else if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //4
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            definitionExp = "wetlandCondition = '" + valueFour + "'";
        }
        //1
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            definitionExp = "wetlandType = '" + valueOne + "'";
        }
        //2
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            definitionExp = "huc8 = '" + valueTwo + "'";
        }
        //24
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            definitionExp = "huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //1234 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //12
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "'";
        }
        //23
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            definitionExp = "huc8 = '" + valueTwo + "'";
        }
        //13 
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            definitionExp = "wetlandType = '" + valueOne + "'";
        }
        //34
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            definitionExp = "wetlandCondition = '" + valueFour + "'";
        } 
        else {
            definitionExp = "";
        }

        console.log(definitionExp);

        if (ecoSelected != "All" && definitionExp != "") {
            plantSites.definitionExpression =  definitionExp + " AND ecolevel3 = '" + ecoSelected + "'";
        } else if (ecoSelected == "All" && definitionExp != "") {
            plantSites.definitionExpression =  definitionExp;
        } else if (ecoSelected != "All" && definitionExp == "") {
            plantSites.definitionExpression =  "ecolevel3 = '" + ecoSelected + "'";
        }

        console.log(plantSites.definitionExpression);



        //add feature count and add x to upper right corner of table to close it
        plantSites.queryFeatureCount().then(function(count) {
            document.getElementById("featureCount").innerHTML =
                "<b>Showing attributes for " +
                count + " features </b>"
            document.getElementById("removeX").setAttribute("class", "glyphicon glyphicon-remove");
            document.getElementById("removeX").setAttribute("style", "float: right;");

        });

        var query = plantSites.createQuery();
        //query.where = "STATE_NAME = 'Washington'";
        query.outFields = ["OBJECTID", "huc8", "siteCode", "ecoSystem", "surveyDate", "hgmClass", "wetlandType", "wetlandCondition", "coverMethod", "confidential"];

        plantSites.queryFeatures(query).then(function(e) {
            console.log(e);


            resultsArray = e["features"];
            console.log(resultsArray);
            // put our attributes in an object the datagrid can ingest.
            var srch = {
                "items": []
            };
            resultsArray.forEach(function(ftrs) {

                var att = ftrs.attributes;

                srch.items.push(att);
            });

            var fieldArray = [
                //{alias: 'ObjectId', name: 'ObjectId'}, 
                {
                    alias: 'Watershed',
                    name: 'huc8'
                },
                {
                    alias: 'Site Code',
                    name: 'siteCode'
                },
                {
                    alias: 'Ecological System',
                    name: 'ecoSystem'
                },
                {
                    alias: 'Survey Date',
                    name: 'surveyDate'
                },
                {
                    alias: 'HGM Class',
                    name: 'hgmClass'
                },
                {
                    alias: 'Wetland Type',
                    name: 'wetlandType'
                },
                {
                    alias: 'Wetland Condition',
                    name: 'wetlandCondition'
                },
                {
                    alias: 'Cover Method',
                    name: 'coverMethod'
                },
            ];

            e.fields = fieldArray;
            console.log(e);
            getResults(e);
        });


        if (!plantSites.visible) {
            plantSites.visible = true;
        }
    } //end setDefinitionExpression function

    function defQuery() {
        console.log('def query');
        //doClear();
        var valueOne = typeSelect.options[typeSelect.selectedIndex].value;
        var valueTwo = waterShedSelect.options[waterShedSelect.selectedIndex].value;
        //var valueThree = hgmSelect.options[hgmSelect.selectedIndex].value;
        var valueFour = conditionSelect.options[conditionSelect.selectedIndex].value;


        //134
        if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //124 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //234 
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            plantSites.definitionExpression = "huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //123 
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "'";
        }
        //14
        else if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //4
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            plantSites.definitionExpression = "wetlandCondition = '" + valueFour + "'";
        }
        //1
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "'";
        }
        //2
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            plantSites.definitionExpression = "huc8 = '" + valueTwo + "'";
        }
        //24
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            plantSites.definitionExpression = "huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //1234 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //12
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "'";
        }
        //23
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            plantSites.definitionExpression = "huc8 = '" + valueTwo + "'";
        }
        //13 
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "";
        }
        //34
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            plantSites.definitionExpression = "wetlandCondition = '" + valueFour + "'";
        } 
        else {
            plantSites.definitionExpression = "";
        }

        console.log(plantSites.definitionExpression);

        var defExp = plantSites.definitionExpression;



        plantSites.queryFeatureCount().then(function(count) {
            const query = new Query();
            query.where = defExp + " AND confidential = '0'";
            plantSites.queryFeatureCount(query).then(function(countConf) {
                //console.log(count); // prints the total number of client-side graphics to the console
                //   document.getElementById("count").innerHTML=count + " features returned."; 
                document.getElementById("featureCount2").innerHTML =
                    "<b>Found " +
                    count + " sites (" + countConf + " public) </b>"
                document.getElementById("removeX").setAttribute("class", "glyphicon glyphicon-remove");
                document.getElementById("removeX").setAttribute("style", "float: right;");
            })
        });

        if (!plantSites.visible) {
            plantSites.visible = true;
        }

    }


    function ecoQuery() {
        console.log('eco query');
        //doClear();

        var valueThree = ecoLevel.options[ecoLevel.selectedIndex].value;
        console.log(valueThree);



        var defExp = "ecolevel3 = '" + valueThree + "'";
        console.log(defExp);

        plantSites.definitionExpression = defExp;


        plantSites.queryFeatureCount().then(function(count) {
            console.log(count);
            const query = new Query();
            query.where = defExp + " AND confidential = '0'";
            plantSites.queryFeatureCount(query).then(function(countConf) {
                //console.log(count); // prints the total number of client-side graphics to the console
                //   document.getElementById("count").innerHTML=count + " features returned."; 
                document.getElementById("featureCount2").innerHTML =
                    "<b>Found " +
                    count + " sites (" + countConf + " public) </b>"
                document.getElementById("removeX").setAttribute("class", "glyphicon glyphicon-remove");
                document.getElementById("removeX").setAttribute("style", "float: right;");
            })
        });

        if (!plantSites.visible) {
            plantSites.visible = true;
        }

    }




    function doSpeciesSummary() {
        mapView.graphics.removeAll()
        mapView.popup.close();
        console.log("doSpeciesSummary");
        doSpeciesSummaryClear();

        gridFields = ["species", "commonName", "speciesCount", "meanCover", "nativity", "noxious", "growthForm", "indicator"];

        var queryParams = "";

        var ecoSelected = ecoLevel.options[ecoLevel.selectedIndex].value;

        var valueOne = typeSelect.options[typeSelect.selectedIndex].value;
        var valueTwo = waterShedSelect.options[waterShedSelect.selectedIndex].value;
        //var valueThree = hgmSelect.options[hgmSelect.selectedIndex].value;
        var valueFour = conditionSelect.options[conditionSelect.selectedIndex].value;


        //134
        if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //124 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //234 
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            queryParams = "huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //123 
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "'";
        }
        //14
        else if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //4
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            queryParams = "wetlandCondition = '" + valueFour + "'";
        }
        //1
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            queryParams = "wetlandType = '" + valueOne + "'";
        }
        //2
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            queryParams = "huc8 = '" + valueTwo + "'";
        }
        //24
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            queryParams = "huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //1234 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "' AND wetlandCondition = '" + valueFour + "'";
        }
        //12
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND huc8 = '" + valueTwo + "'";
        }
        //23
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            queryParams = "huc8 = '" + valueTwo + "";
        }
        //13 
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            queryParams = "wetlandType = '" + valueOne + "'";
        }
        //34
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            queryParams = "wetlandCondition = '" + valueFour + "'";
        } 
        else {
            queryParams = "";
        }
        console.log(queryParams);
        if (ecoSelected != "All" && queryParams != "") {
            plantSites.definitionExpression =  queryParams + " AND ecolevel3 = '" + ecoSelected + "'";
        } else if (ecoSelected == "All" && queryParams != "") {
            plantSites.definitionExpression =  queryParams;
        } else if (ecoSelected != "All" && queryParams == "") {
            plantSites.definitionExpression =  "ecolevel3 = '" + ecoSelected + "'";
        }


        //add feature count and add x to upper right corner of table to close it
        plantSites.queryFeatureCount().then(function(count) {
            console.log(count);
            sitesCount = count;
            // document.getElementById("featureCount").innerHTML =
            //     "<b>Showing attributes for " +
            //     count + " features at " + sitesCount + " sites</b>"
            // document.getElementById("removeX").setAttribute("class", "glyphicon glyphicon-remove");
            // document.getElementById("removeX").setAttribute("style", "float: right;");

        });
        console.log(plantSites.definitionExpression);


        var query = sitesSpeciesJoin.createQuery();
        query.where = queryParams;
        query.outFields = ["ObjectId", "species", "commonName", "siteCode", "nativity", "cover", "noxious", "growthForm", "finalIndicator"];

        sitesSpeciesJoin.queryFeatures(query).then(function(e) {
            //console.log(e);



            resultsArray = e["features"];
            //console.log(resultsArray);          
            // put our attributes in an object the datagrid can ingest.
            var srch = {
                "items": []
            };
            resultsArray.forEach(function(ftrs) {

                var att = ftrs.attributes;

                srch.items.push(att);
            });
            console.log(srch);
            var summaryArray = [];

            srch.items.forEach(function(calc) {
                summaryArray.push(calc);
            });

            //console.log(summaryArray);

            var counts = [];


            //count the number of sites each species is present at
            for (var i = 0; i < summaryArray.length; i++) {
                //var cover = summaryArray[i].cover;
                var num = summaryArray[i].species;
                var coverSum = "";

                if (counts[num] = counts[num]) {
                    counts[num] = counts[num] + 1;
                    //counts[coverSum] = counts[coverSum] + cover;
                } else {
                    counts[num] = 1;
                };

            }
            //console.log(counts);

            //sum the cover values for each species
            totals = summaryArray.reduce(function(r, o) {
                (r[o.species]) ? r[o.species] += o.cover: r[o.species] = o.cover;
                return r;
            }, []);

            //console.log(totals);

            //add the counts to the summaryArray
            for (var i = 0; i < summaryArray.length; i++) {
                const entries = Object.entries(counts)
                for (const [specie, count] of entries) {
                    //console.log(count + specie);
                    //console.log(summaryArray[i].species);
                    if (specie == summaryArray[i].species) {
                        summaryArray[i].speciesCount = count;
                    }

                }

            }

            //console.log(summaryArray);

            //add the mean cover to the summaryArray
            for (var i = 0; i < summaryArray.length; i++) {
                const entries = Object.entries(totals)
                const totCount = summaryArray[i].speciesCount;
                for (const [specie, count] of entries) {
                    //console.log(count + specie);
                    //console.log(summaryArray[i].species);
                    if (specie == summaryArray[i].species) {
                        var meanAvg = count / totCount;
                        summaryArray[i].meanCover = meanAvg.toFixed(1);
                    }

                }

            }

            console.log(summaryArray);
            //convert menaCover from string to integer
            for (var i in summaryArray) {
                summaryArray[i].meanCover = +summaryArray[i].meanCover;
            }

            console.log(summaryArray);

            //remove duplicate entries based on species
            function removeDuplicates(originalArray, prop) {
                var newArray = [];
                var lookupObject = {};

                for (var i in originalArray) {
                    lookupObject[originalArray[i][prop]] = originalArray[i];
                }

                for (i in lookupObject) {
                    newArray.push(lookupObject[i]);
                }
                return newArray;
            }

            var uniqueArray = removeDuplicates(summaryArray, "species");

            var fieldArray = [
                //{alias: 'ObjectId', name: 'ObjectId'}, 
                {
                    alias: 'Scientific Name',
                    name: 'species'
                },
                {
                    alias: 'Common Name',
                    name: 'commonName'
                },
                {
                    alias: 'Site Count',
                    name: 'speciesCount'
                },
                {
                    alias: 'Mean Cover',
                    name: 'meanCover'
                },
                {
                    alias: 'Nativity',
                    name: 'nativity'
                },
                {
                    alias: 'Noxious',
                    name: 'noxious'
                },
                {
                    alias: 'Growth Form',
                    name: 'growthForm'
                },
                {
                    alias: 'Wetland Indicator',
                    name: 'finalIndicator'
                },
            ];


            var forObject = {
                features: '',
                fields: ''
            }

            forObject.features = uniqueArray;
            forObject.fields = fieldArray;

            console.log(forObject)



            console.log(uniqueArray)

            getResults(forObject);




        });


    } //end doSpeciesSummary function



    function doQuerySpecies() {

        mapView.graphics.removeAll()
        //mapView.popup.close();
        console.log("doQuerySpecies");
        //doClear();
        gridFields = ["species", "commonName", "growthForm", "nativity",
            "finalIndicator", "cover", "collection"
        ];

        var querySpecies = new QueryTask({
            url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalTestV3_View/FeatureServer/0"
        });

        relationQuerySpecies = new RelationshipQuery({
            objectIds: [objectID],
            outFields: ["OBJECTID", "species", "commonName", "growthForm", "nativity", "indicatorWmvc", "cover", "collection", "catalogNumber"],
            relationshipId: 0
        });

        querySpecies.executeRelationshipQuery(relationQuerySpecies).then(function(rslts) {
            //console.log(rslts);

            var poop = rslts[objectID];

            poop.fields = gridFields;

            poop.fields.forEach(function(fields, i) {
                fields.name = gridFields[i]
                fields.alias = gridFields[i]
            });

            console.log(poop);
            getResults(rslts[objectID]);

        });

       

    }


    on(typeSelect, "change", function(evt) {
        //defQuery();
        type1 = evt.target.value;
        console.log(type1);
        var valueOne = waterShedSelect.options[waterShedSelect.selectedIndex].value;

    })


    on(waterShedSelect, "change", function(evt) {

        //defQuery();
        type2 = evt.target.value;
        console.log(type2);



    })

    on(ecoLevel, "change", function(evt) {
        ecoQuery();
        type4 = evt.target.value;
        console.log(type4);

        var sqlQuery = "";
        var weQuery = new Query();
        var hucQuery = new Query();
        var conditionQuery = new Query();



        sqlQuery = "ecolevel3 = '" + type4 + "'";

        console.log(sqlQuery);


        weQuery.outFields = ["wetlandType"];
        weQuery.returnDistinctValues = true;
        weQuery.orderByFields = ["wetlandType"];
        weQuery.where = sqlQuery;
        plantSites.queryFeatures(weQuery).then(function(e) {
            console.log(e);
            addToSelect(e);
        })

        hucQuery.outFields = ["huc8"];
        hucQuery.returnDistinctValues = true;
        hucQuery.orderByFields = ["huc8"];
        hucQuery.where = sqlQuery;
        plantSites.queryFeatures(hucQuery).then(function(et) {
            addToSelect2(et);
        })

        conditionQuery.outFields = ["wetlandCondition"];
        conditionQuery.returnDistinctValues = true;
        conditionQuery.orderByFields = ["wetlandCondition"];
        conditionQuery.where = sqlQuery;
        plantSites.queryFeatures(conditionQuery).then(function(ett) {
            addToSelect4(ett);
        })

    })

    on(conditionSelect, "change", function(evt) {
        //defQuery();
        type4 = evt.target.value;
        console.log(type4);

    })

    document.getElementById("removeX").addEventListener("click", function(evt) {
        mapView.popup.close();
        mapView.graphics.removeAll();
        doClear();

    })

    //hide grid on map click. need to make an X icon on the right hand side of it eventually
    mapView.on('click', function(event) {
        //doClear();
    });




    // species dgrid function
    watchUtils.when(mapView.popup, "selectedFeature", function species(evt) {

        objectID = mapView.popup.selectedFeature.attributes.OBJECTID;
        console.log(objectID);

    }); // end watchUtil



    mapView.popup.on("trigger-action", function(event) { // Execute the relatedSpecies() function if the species action is clicked
        if (event.action.id === "related-species") {
            console.log("species action clicked");
            singleSiteSpeciesID = "";
            console.log(event.target.features[0].attributes.OBJECTID);
            singleSiteSpeciesID = event.target.features[0].attributes.OBJECTID;
            doQuerySpecies();
        }
    });

    mapView.popup.watch("hide", function(e) {
        mapView.popup.close();
        mapView.graphics.removeAll();
        console.log("closing popup");
    });

    // Basemap events
    query("#selectBasemapPanel").on("change", function(e) {
        if (e.target.value == "ustopo") {
            // setup the ustopo basemap global variable.
            var ustopo = new Basemap({
                baseLayers: new TileLayer({
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer"
                }),
                title: "usTopographic",
                id: "ustopo"
            });
            mapView.map.basemap = ustopo;
            // if mapview use basemaps defined in the value-vector=, but if mapview use value=
        } else if (map.mview == "map") {
            mapView.map.basemap = e.target.options[e.target.selectedIndex].dataset.vector;
        } else { // =="scene"
            mapView.map.basemap = e.target.value;
        }
    });




});