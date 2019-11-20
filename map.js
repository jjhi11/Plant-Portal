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
    "esri/widgets/LayerList",
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
], function(Map, MapView, SimpleMarkerSymbol, GraphicsLayer, SketchViewModel, Graphic, FeatureLayer, Query, QueryTask, Home, Zoom, Compass, Search, Legend, LayerList, BasemapToggle, watchUtils, RelationshipQuery, AttachmentsContent, Collapse, Dropdown, query, Memory, ObjectStore, ItemFileReadStore, DataGrid, OnDemandGrid, ColumnHider, Selection, StoreAdapter, List, declare, request, mouse, CalciteMaps, CalciteMapArcGISSupport, on, arrayUtils, dom, domClass, domConstruct) {

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

    // let gridFields = ["project", "watershed", "siteCode", "ecoSystem",
    //     "hgmClass", "wetlandType", "vegetationCondition", "coverMethod", "surveyDate"
    // ];

    let speciesFields = ["OBJECTID", "family", "scientificName", "commonName", "cover",
        "nativity", "noxious", "growthForm", "wetlandIndicator", "cValue"
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

        if (feature.graphic.attributes.project) {
            content += "<span class='bold' title='Organization'><b>Project: </b></span>{project}<br/>";
        }
            if (feature.graphic.attributes.siteCode) {
                content += "<span class='bold' title='Site Code'><b>Site Code: </b></span>{siteCode}<br/>";
            }
            if (feature.graphic.attributes.surveyDate) {
                console.log(feature.graphic.attributes.surveyDate);
                const date = moment(feature.graphic.attributes.surveyDate).format('ll');
                content += "<span class='bold' title='Survey Date'><b>Survey Date: </b></span>{surveyDate}<br/>";
            }
            if (feature.graphic.attributes.watershed) {
                content += "<span class='bold' title='HGM Class'><b>Watershed: </b></span>{watershed}<br/>";
            }
            if (feature.graphic.attributes.ecoregionalGroup) {
                content += "<span class='bold' title='Ecological System'><b>Ecoregional Group: </b></span>{ecoregionalGroup}<br/>";
            }
            if (feature.graphic.attributes.wetlandType) {
                content += "<span class='bold' title='Wetland Type'><b>Wetland Type: </b></span>{wetlandType}<br/>";
            }
            if (feature.graphic.attributes.projectWetlandClass) {
                content += "<span class='bold' title='Wetland Type'><b>Project Wetland Class: </b></span>{projectWetlandClass}<br/>";
            }
            if (feature.graphic.attributes.vegetationCondition) {
                content += "<span class='bold' title='Vegetation Condition'><b>Vegetation Condition: </b></span>{vegetationCondition}<br/>";
            }
            if (feature.graphic.attributes.privacyStatus) {
                content += "<span class='bold' title='Condition Method'><b>Privacy Status: </b></span>{privacyStatus}<br/>";
            }
            if (feature.graphic.attributes.meanC) {
                content += "<span class='bold' title='Site Code'><b>Mean C: </b></span>{meanC}<br/>";
            }
            if (feature.graphic.attributes.relativeNativeCover) {
                content += "<span class='bold' title='Site Code'><b>Relative Native Cover: </b></span>{relativeNativeCover}<br/>";
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
        url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalV4_View/FeatureServer",
        title: "Plant Sites",
        visibile: true,
        outFields: ["*"],
        //outFields: ["watershed", "wetlandType"],
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
                        fieldName: "vegetationCondition",
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
                    text: "<b>Project: </b>{project}<br><b>Site Code: </b>{siteCode}<br><b>Survey Date: </b>{surveyDate}<br><b>Watershed: </b>{watershed}<br><b>Ecoregional Group: </b>{ecoregionalGroup}<br><b>Wetland Type: </b>{wetlandType}<br><b>Project Wetland Class: </b>{projectWetlandClass}<br><b>Vegetation Condition: </b>{vegetationCondition}<br><b>Privacy Status: </b>{privacyStatus}<br><b>Mean C: </b>{meanC}<br><b>Relative Native Cover: </b>{relativeNativeCover}<br>"
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
        url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/sitesSpeciesJoinV4/FeatureServer",
        //url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/siteSpeciesJoin/FeatureServer",
        // title: "Plant Sites",
        // visibile: true,
        outFields: ["*"],
        // outFields: ["watershed", "wetlandType"],
        // popupTemplate: {
        //     title: "Plant Sites",
        //     actions: [speciesAction],
        //     content: "{siteCode:contentSites}{surveyDate:contentSites}{coverMethod:contentSites}{Organization:contentSites}{ecoSystem:contentSites}{hgmClass:contentSites}{wetlandType:contentSites}{vegetationCondition:contentSites}{conditionMethod:contentSites}"
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
    // var legendWidget = new Legend({
    //     //container: "legendDiv",
    //     view: mapView
    // });

    const layerList = new LayerList({
        view: mapView,
        container: "legendDiv",
        listItemCreatedFunction: function(event) {
          const item = event.item;
          if (item.layer.type != "group") {
            // don't show legend twice
            item.panel = {
              content: "legend",
              open: true
            };
          }
        }
      });


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
            outFields: ["OBJECTID", "project", "siteCode", "surveyDate", "watershed", "ecoregionalGroup", "wetlandType", "projectWetlandClass", "vegetationCondition", "privacyStatus", "meanC", "relativeNativeCover"]
        };

        // query graphics from the csv layer view. Geometry set for the query
        // can be polygon for point features and only intersecting geometries are returned
        plantLayerView
            .queryFeatures(query)
            .then(function(results) {
                gridFields = ["OBJECTID", "project", "siteCode", "surveyDate", "watershed", "ecoregionalGroup", "wetlandType", "projectWetlandClass", "vegetationCondition", "privacyStatus", "meanC", "relativeNativeCover"];
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
        polygonGraphicsLayer = new GraphicsLayer({
            listMode: "hide"
        });
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
        if (grid.columns[0].field == "watershed") {

            console.info("Sites");
            grid.on("th.field-project:mouseover", function(evt) {
                console.info("hover");
                evt.target.title = "Project Name";
            });
            grid.on("th.field-watershed:mouseover", function(evt) {
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

              //  //checks to see if site is confidential or not
                //if (item.attributes.confidential != 1) {
                //    console.log("public");
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
                //} else {
                //     console.log("confidential");

                //     //masking confidential sites geographically by adding to their lat long values with a randomly generated number between min and max variables
                //     var min = .003;
                //     var max = .05;
                //     var random = Math.random() * (+max - +min) + +min;
                //     maskedLat = item.geometry.latitude + random;
                //     maskedLong = item.geometry.longitude - random;
                //     var cntr = [];
                //     cntr.push(maskedLong);
                //     cntr.push(maskedLat);
                //     item.geometry.latitude = maskedLat;
                //     item.geometry.longitude = maskedLong;
                //     console.log(cntr);

                //     mapView.goTo({
                //         center: cntr, // position:
                //         zoom: 13
                //     });

                //     mapView.graphics.removeAll();
                //     var selectedGraphic = new Graphic({

                //         geometry: item.geometry,
                //         // symbol: new SimpleMarkerSymbol({
                //         //     //color: [0,255,255],
                //         //     style: "circle",
                //         //     //size: "8px",
                //         //     outline: {
                //         //         color: [255, 255, 0],
                //         //         width: 3
                //         //     }
                //         // })
                //     });

                //     mapView.graphics.add(selectedGraphic);

                //     mapView.popup.open({
                //         features: [item],
                //         location: cntr
                //     });
                // }
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
        url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalV4_View/FeatureServer/1",
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


        //format the surveyDate 
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
            url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalV4_View/FeatureServer/0"
        });

        var speciesRelateQuery = new RelationshipQuery({
            objectIds: idArray,
            outFields: ["scientificName"],
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
                    var poop = et.attributes.scientificName;
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
            url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalV4_View/FeatureServer/0"
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
        ecoQuery.outFields = ["ecoregionalGroup"];
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


    // Add the unique values to the watershed select element.
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
            option.text = value.attributes.watershed;
            waterShedSelect.add(option);
        });
        //waterShedSelect.remove(1);
    }


    //Add the unique values to the ecoregionalGroup select element.
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
            option.text = value.attributes.ecoregionalGroup;
            ecoLevel.add(option);
        });
        //hgmSelect.remove(1);
    }

    // Add the unique values to the vegetationCondition select element.
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
            option.text = value.attributes.vegetationCondition;
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

        hucQuery.outFields = ["watershed"];
        hucQuery.returnDistinctValues = true;
        hucQuery.orderByFields = ["watershed"];
        hucQuery.where = "1=1";
        plantSites.queryFeatures(hucQuery).then(function(e) {
            addToSelect2(e);
        })

        conditionQuery.outFields = ["vegetationCondition"];
        conditionQuery.returnDistinctValues = true;
        conditionQuery.orderByFields = ["vegetationCondition"];
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
            url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalV4_View/FeatureServer/4",
        });

        //Query the related table for names that match commonName field with the user selected option in the DOM
        var speciesQuery = new Query();
        speciesQuery.outFields = ["*"];
        speciesQuery.where = "scientificName = '" + speciesCommonName + "'";

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
                gridFields = ["OBJECTID", "project", "siteCode", "surveyDate", "watershed", "ecoregionalGroup", "wetlandType", "projectWetlandClass", "vegetationCondition", "privacyStatus", "meanC", "relativeNativeCover"];
                query.where = defExp;
                query.outFields = ["OBJECTID", "project", "siteCode", "surveyDate", "watershed", "ecoregionalGroup", "wetlandType", "projectWetlandClass", "vegetationCondition", "privacyStatus", "meanC", "relativeNativeCover"];

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

        gridFields = ["OBJECTID", "project", "siteCode", "surveyDate", "watershed", "ecoregionalGroup", "wetlandType", "projectWetlandClass", "vegetationCondition", "privacyStatus", "meanC", "relativeNativeCover"];




        var valueOne = typeSelect.options[typeSelect.selectedIndex].value;
        var valueTwo = waterShedSelect.options[waterShedSelect.selectedIndex].value;
        var ecoSelected = ecoLevel.options[ecoLevel.selectedIndex].value;
        var valueFour = conditionSelect.options[conditionSelect.selectedIndex].value;
        var definitionExp = "";
        var ecoDef = "";


        //134
        if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //124 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //234 
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            definitionExp = "watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //123 
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "'";
        }
        //14
        else if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //4
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            definitionExp = "vegetationCondition = '" + valueFour + "'";
        }
        //1
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            definitionExp = "wetlandType = '" + valueOne + "'";
        }
        //2
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            definitionExp = "watershed = '" + valueTwo + "'";
        }
        //24
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            definitionExp = "watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //1234 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //12
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            definitionExp = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "'";
        }
        //23
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            definitionExp = "watershed = '" + valueTwo + "'";
        }
        //13 
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            definitionExp = "wetlandType = '" + valueOne + "'";
        }
        //34
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            definitionExp = "vegetationCondition = '" + valueFour + "'";
        } 
        else {
            definitionExp = "";
        }

        console.log(definitionExp);

        if (ecoSelected != "All" && definitionExp != "") {
            plantSites.definitionExpression =  definitionExp + " AND ecoregionalGroup = '" + ecoSelected + "'";
        } else if (ecoSelected == "All" && definitionExp != "") {
            plantSites.definitionExpression =  definitionExp;
        } else if (ecoSelected != "All" && definitionExp == "") {
            plantSites.definitionExpression =  "ecoregionalGroup = '" + ecoSelected + "'";
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
        query.outFields = ["OBJECTID", "project", "siteCode", "surveyDate", "watershed", "ecoregionalGroup", "wetlandType", "projectWetlandClass", "vegetationCondition", "privacyStatus", "meanC", "relativeNativeCover"];

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
                    name: 'watershed'
                },
                {
                    alias: 'Site Code',
                    name: 'siteCode'
                },
                {
                    alias: 'Ecoregional Group',
                    name: 'ecoregionalGroup'
                },
                {
                    alias: 'Survey Date',
                    name: 'surveyDate'
                },
                {
                    alias: 'Project Wetland Class',
                    name: 'projectWetlandClass'
                },
                {
                    alias: 'Wetland Type',
                    name: 'wetlandType'
                },
                {
                    alias: 'Vegetation Condition',
                    name: 'vegetationCondition'
                },
                {
                    alias: 'Privacy Status',
                    name: 'privacyStatus'
                },
                {
                    alias: 'Mean C',
                    name: 'meanC'
                },
                {
                    alias: 'Relative Native Cover',
                    name: 'relativeNativeCover'
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
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //124 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //234 
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            plantSites.definitionExpression = "watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //123 
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "'";
        }
        //14
        else if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //4
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            plantSites.definitionExpression = "vegetationCondition = '" + valueFour + "'";
        }
        //1
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "'";
        }
        //2
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            plantSites.definitionExpression = "watershed = '" + valueTwo + "'";
        }
        //24
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            plantSites.definitionExpression = "watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //1234 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //12
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "'";
        }
        //23
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            plantSites.definitionExpression = "watershed = '" + valueTwo + "'";
        }
        //13 
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            plantSites.definitionExpression = "wetlandType = '" + valueOne + "";
        }
        //34
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            plantSites.definitionExpression = "vegetationCondition = '" + valueFour + "'";
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



        var defExp = "ecoregionalGroup = '" + valueThree + "'";
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

        gridFields = ["scientificName", "commonName", "speciesCount", "meanCover", "nativity", "noxious", "growthForm", "wetlandIndicator"];

        var queryParams = "";

        var ecoSelected = ecoLevel.options[ecoLevel.selectedIndex].value;

        var valueOne = typeSelect.options[typeSelect.selectedIndex].value;
        var valueTwo = waterShedSelect.options[waterShedSelect.selectedIndex].value;
        //var valueThree = hgmSelect.options[hgmSelect.selectedIndex].value;
        var valueFour = conditionSelect.options[conditionSelect.selectedIndex].value;


        //134
        if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //124 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //234 
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            queryParams = "watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //123 
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "'";
        }
        //14
        else if (valueOne != "All" && valueTwo == "All" && valueFour != "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //4
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            queryParams = "vegetationCondition = '" + valueFour + "'";
        }
        //1
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            queryParams = "wetlandType = '" + valueOne + "'";
        }
        //2
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            queryParams = "watershed = '" + valueTwo + "'";
        }
        //24
        else if (valueOne == "All" && valueTwo != "All" && valueFour != "All") {
            queryParams = "watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //1234 
        else if (valueOne != "All" && valueTwo != "All" && valueFour != "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "' AND vegetationCondition = '" + valueFour + "'";
        }
        //12
        else if (valueOne != "All" && valueTwo != "All" && valueFour == "All") {
            queryParams = "wetlandType = '" + valueOne + "' AND watershed = '" + valueTwo + "'";
        }
        //23
        else if (valueOne == "All" && valueTwo != "All" && valueFour == "All") {
            queryParams = "watershed = '" + valueTwo + "";
        }
        //13 
        else if (valueOne != "All" && valueTwo == "All" && valueFour == "All") {
            queryParams = "wetlandType = '" + valueOne + "'";
        }
        //34
        else if (valueOne == "All" && valueTwo == "All" && valueFour != "All") {
            queryParams = "vegetationCondition = '" + valueFour + "'";
        } 
        else {
            queryParams = "";
        }
        console.log(queryParams);
        if (ecoSelected != "All" && queryParams != "") {
            plantSites.definitionExpression =  queryParams + " AND ecoregionalGroup = '" + ecoSelected + "'";
        } else if (ecoSelected == "All" && queryParams != "") {
            plantSites.definitionExpression =  queryParams;
        } else if (ecoSelected != "All" && queryParams == "") {
            plantSites.definitionExpression =  "ecoregionalGroup = '" + ecoSelected + "'";
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
        query.outFields = ["OBJECTID", "scientificName", "commonName", "siteCode", "nativity", "cover", "noxious", "growthForm", "wetlandIndicator"];

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
                var num = summaryArray[i].scientificName;
                var coverSum = "";

                if (counts[num] = counts[num]) {
                    counts[num] = counts[num] + 1;
                    //counts[coverSum] = counts[coverSum] + cover;
                } else {
                    counts[num] = 1;
                };

            }
            //console.log(counts);

            //sum the cover values for each scientificName
            totals = summaryArray.reduce(function(r, o) {
                (r[o.scientificName]) ? r[o.scientificName] += o.cover: r[o.scientificName] = o.cover;
                return r;
            }, []);

            //console.log(totals);

            //add the counts to the summaryArray
            for (var i = 0; i < summaryArray.length; i++) {
                const entries = Object.entries(counts)
                for (const [specie, count] of entries) {
                    //console.log(count + specie);
                    //console.log(summaryArray[i].species);
                    if (specie == summaryArray[i].scientificName) {
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
                    if (specie == summaryArray[i].scientificName) {
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
                    name: 'scientificName'
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
                    name: 'wetlandIndicator'
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
        gridFields = ["scientificName", "commonName", "growthForm", "nativity",
            "wetlandIndicator", "cover", "family"
        ];

        var querySpecies = new QueryTask({
            url: "https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/plantPortalV4_View/FeatureServer/0"
        });

        relationQuerySpecies = new RelationshipQuery({
            objectIds: [objectID],
            outFields: ["OBJECTID", "scientificName", "commonName", "growthForm", "nativity", "wetlandIndicator", "cover", "family"],
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



        sqlQuery = "ecoregionalGroup = '" + type4 + "'";

        console.log(sqlQuery);


        weQuery.outFields = ["wetlandType"];
        weQuery.returnDistinctValues = true;
        weQuery.orderByFields = ["wetlandType"];
        weQuery.where = sqlQuery;
        plantSites.queryFeatures(weQuery).then(function(e) {
            console.log(e);
            addToSelect(e);
        })

        hucQuery.outFields = ["watershed"];
        hucQuery.returnDistinctValues = true;
        hucQuery.orderByFields = ["watershed"];
        hucQuery.where = sqlQuery;
        plantSites.queryFeatures(hucQuery).then(function(et) {
            addToSelect2(et);
        })

        conditionQuery.outFields = ["vegetationCondition"];
        conditionQuery.returnDistinctValues = true;
        conditionQuery.orderByFields = ["vegetationCondition"];
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