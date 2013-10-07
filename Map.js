/**
 * Map controller
 * Used to manage map layers and showing their related views
 */
Ext.define('CF.controller.Map', {
    extend: 'Ext.app.Controller',

    models: ['Summit'],
    stores: ['Summits'],

    refs: [
        {ref: 'summitChart', selector: 'summitchart'},
        {ref: 'summitGrid', selector: 'summitgrid'}
    ],

    init: function() {
        var me = this;

        me.getSummitsStore().on({
            scope: me,
            load : me.onSummitsStoreLoad
        });

        this.control({
            'cf_mappanel': {
                'beforerender': this.onMapPanelBeforeRender
            }
        }, this);
    },

    onMapPanelBeforeRender: function(mapPanel, options) {
        var me = this;

        var layers = [];

        // OpenLayers object creating
        var wms = new OpenLayers.Layer.WMS(
            "Hydro BNDT",
            "http://ows.geobase.ca/wms/geobase_fr",
            {layers: 'reference:hydro:hydro1m_p,reference:hydro:hydro1m_l'}
        );
        layers.push(wms);
		
		// OpenLayers object creating
        var wms = new OpenLayers.Layer.WMS(
            "Landsat BNDT",
            "http://ows.geobase.ca/wms/geobase_fr",
            {layers: 'l,imagery:landsat7:743'}
        );
        layers.push(wms);
		        // OpenLayers object creating
        var mapserv = new OpenLayers.Layer.WMS(
            "SIGEOM Geologie",
            "http://sigeom.mrn.gouv.qc.ca/SIGEOM_WMS/Request.aspx?",
            {layers: 'Geologie_detaillee_Quebec_50k',transparent:true}, {isBaseLayer: false}
        );
        layers.push(mapserv);
		        // OpenLayers object creating
        var mapserv = new OpenLayers.Layer.WMS(
            "SIGEOM Forage",
            "http://sigeom.mrn.gouv.qc.ca/SIGEOM_WMS/Request.aspx?",
            {layers: 'Forage_diamant',transparent:true}, {isBaseLayer: false}
        );
        layers.push(mapserv);
		
		// OpenLayers object creating
        var mapserv = new OpenLayers.Layer.WMS(
            "WMS MRB",
            "http://geohack2.mapgears.com/cgi-bin/mapserv?map=/opt/scribeui/application/workspaces/portail/demo/map/demo.map",
            {layers: 'default',transparent:true}, {isBaseLayer: false}
        );
        layers.push(mapserv);



        // create vector layer
        var context = {
            getColor: function(feature) {
                if (feature.attributes.elevation < 2000) {
                    return 'green';
                }
                if (feature.attributes.elevation < 2300) {
                    return 'orange';
                }
                return 'white';
            }
        };
        var template = {
            cursor: "pointer",
            fillOpacity: 0.01,
            fillColor: "${getColor}",
            pointRadius: 5,
            strokeWidth: 1,
            strokeOpacity: 0.01,
            strokeColor: "${getColor}",
            graphicName: "circle"
        };
        var style = new OpenLayers.Style(template, {context: context});
        var vecLayer = new OpenLayers.Layer.Vector("vector", {
            styleMap: new OpenLayers.StyleMap({
                  'default': style,
                  'select': {
            cursor: "pointer",
            fillOpacity: 0.7,
            fillColor: "#12FA29",
            pointRadius: 10,
            strokeWidth: 1,
            strokeOpacity: 1,
            strokeColor: "#12FA29",
            graphicName: "circle"}
            }),
            protocol: new OpenLayers.Protocol.HTTP({
                url: "data/Collar.json",
                format: new OpenLayers.Format.GeoJSON()
            }),
            strategies: [new OpenLayers.Strategy.Fixed()],
			displayInLayerSwitcher:false
        });
        layers.push(vecLayer);

        // manually bind store to layer
        me.getSummitsStore().bind(vecLayer);

        mapPanel.map.addLayers(layers);

        // some more controls
        mapPanel.map.addControls([new OpenLayers.Control.DragFeature(vecLayer, {
            autoActivate: true,
            onComplete: function(feature, px) {
                var store = me.getSummitsStore();
                store.fireEvent('update', store, store.getByFeature(feature));
            }
        }),new OpenLayers.Control.LayerSwitcher()]);

        // for dev purpose
        map = mapPanel.map;
        mapPanel = mapPanel;
    },

    onLaunch: function() {
        var me = this;

        // for dev purpose
        ctrl = this;
    },

    onSummitsStoreLoad: function(store, records) {
        // do custom stuff on summits load if you want, for example here we
        // zoom to summits extent
        var dataExtent = store.layer.getDataExtent();
        if (dataExtent) {
            store.layer.map.zoomToExtent(dataExtent);
        }
    }
});
