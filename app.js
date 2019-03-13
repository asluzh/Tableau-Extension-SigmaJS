"use strict";
(function() {
  var unregisterSettingsEventListener;
  var unregisterFilterEventListener;
  var savedSheetName;
  var savedSourceNodeField;
  var savedSourceTypeField;
  var savedTargetNodeField;
  var savedTargetTypeField;
  var inputWs;
  var sigmaInstance;
  var activeState;
  var tooltips;
  var dragListener;
  var lasso;
  var select;
  var keyboard;

  $(document).ready(function() {
    tableau.extensions.initializeAsync({ configure: configure }).then(
      function() {
        getSettings();
        renderGraph();
        unregisterSettingsEventListener = tableau.extensions.settings.addEventListener(
          tableau.TableauEventType.SettingsChanged,
          function(settingsEvent) {
            getSettings();
            renderGraph();
          }
        );
      },
      function() {
        console.log("Error while Initializing: " + err.toString());
      }
    );
  });

  function getSettings() {
    savedSheetName = tableau.extensions.settings.get("sheet"); // TODO: source data should be split between nodes and edges (2 source sheets required)
    savedSourceNodeField = tableau.extensions.settings.get("source_node");
    savedSourceTypeField = tableau.extensions.settings.get("source_type");
    savedTargetNodeField = tableau.extensions.settings.get("target_node");
    savedTargetTypeField = tableau.extensions.settings.get("target_type");
    if (unregisterFilterEventListener) {
      unregisterFilterEventListener();
    }
    inputWs = getSelectedSheet(savedSheetName);
    unregisterFilterEventListener = inputWs.addEventListener(
      tableau.TableauEventType.FilterChanged,
      function() {
        // console.log("FilterChanged");
        //renderGraph();
        inputWs.getSummaryDataAsync().then(updateGraph);
      }
    );
  }

  function renderGraph() {
    // define an empty graph
    if (
      savedSheetName &&
      savedSourceNodeField &&
      savedSourceTypeField &&
      savedTargetNodeField &&
      savedTargetTypeField
    ) {
      $("#pleaseconfigure").hide();
      inputWs.getSummaryDataAsync().then(function(dataTable) {
        // console.log(dataTable);
        var g = getGraphData(dataTable);
        // Instantiate sigma:
        $("#graph-container").empty();
        sigma.renderers.def = sigma.renderers.canvas;
        // if (sigmaInstance) {
        //   sigmaInstance.kill();
        // }
        sigmaInstance = new sigma({
          graph: g,
          container: "graph-container", //document.getElementById("graph-container"), //
          settings: {
            // TODO: input some of the settings via UI
            sideMargin: 5,
            // scalingMode: "inside",
            minNodeSize: 3,
            maxNodeSize: 15,
            minEdgeSize: 2,
            maxEdgeSize: 2,
            // edgeLabelSize: "proportional",
            // minArrowSize: 1,
            // edgeHoverSizeRatio: 2,
            // drawLabels: false,
            // batchEdgesDrawing: true
            // labelHoverBGColor: "node",
            labelThreshold: 8, // which zoom level is enough to display the labels
            borderSize: 1,
            outerBorderSize: 2,
            defaultNodeBorderColor: "#fff",
            defaultNodeOuterBorderColor: "rgb(100, 100, 200)",
            nodeHaloColor: "rgba(100, 100, 200, 0.2)",
            // drawGlyphs: true
            // autoRescale: ["nodeSize", "edgeSize"],
            zoomingRatio: 1.382,
            doubleClickZoomingRatio: 1.7,
            zoomMin: 0.1,
            zoomMax: 10,
            //////////////////////////////////////////
            defaultEdgeType: "tapered",
            // font: "robotoregular",
            defaultLabelColor: "#000",
            defaultLabelSize: 11,
            // labelThreshold: 8,
            // labelAlignment: "center",
            defaultEdgeLabelSize: 11,
            edgeLabelThreshold: 3,
            labelHoverShadow: "",
            edgeLabelHoverShadow: "",
            maxNodeLabelLineLength: 35,
            defaultNodeColor: "#999999",
            nodeBorderColor: "default",
            hoverFontStyle: "bold",
            nodeHoverBorderSize: 2,
            defaultNodeHoverBorderColor: "#ffffff",
            nodeActiveColor: "node",
            defaultNodeActiveColor: "#999999",
            nodeActiveLevel: 3,
            nodeActiveBorderSize: 2,
            nodeActiveOuterBorderSize: 4,
            defaultNodeActiveBorderColor: "#ffffff",
            defaultNodeActiveOuterBorderColor: "#f65565",
            nodeHoverLevel: 1,
            edgeColor: "default",
            defaultEdgeColor: "#a9a9a9",
            edgeHoverExtremities: false, // also highlight nodes on edge hover
            edgeHoverLevel: 1,
            activeFontStyle: "bold",
            edgeActiveColor: "default",
            defaultEdgeActiveColor: "#f65565",
            edgeActiveLevel: 3,
            nodeHaloSize: 10,
            edgeHaloSize: 5,
            nodeHaloColor: "#ffffff",
            edgeHaloColor: "#ffffff",
            nodeHaloStroke: !0,
            nodeHaloStrokeColor: "#a9a9a9",
            nodeHaloStrokeWidth: 0.5,
            // imgCrossOrigin: "anonymous",
            // legendBorderWidth: 0.5,
            // legendBorderRadius: 4,
            // legendBorderColor: "#999999",
            // doubleClickZoomDuration: 200,
            // autoRescale: ["nodeSize", "edgeSize"],
            // doubleClickEnabled: !0,
            enableEdgeHovering: true,
            edgeHoverPrecision: 10,
            approximateLabelWidth: !0
            // nodesPowRatio: 0.8,
            // edgesPowRatio: 0.8,
            // animationsTime: 1e3
          }
        });
        activeState = sigma.plugins.activeState(sigmaInstance);
        // Instanciate the ActiveState plugin:
        // var activeState = sigma.plugins.activeState(sigmaInstance);
        keyboard = sigma.plugins.keyboard(
          sigmaInstance,
          sigmaInstance.renderers[0]
        );

        // Initialize the Select plugin:
        select = sigma.plugins.select(sigmaInstance, activeState);
        select.bindKeyboard(keyboard);

        //sigmaInstance.startForceAtlas2(); // not stable, probably needs an additional cooling-down parameter
        var frListener = sigma.layouts.fruchtermanReingold.configure(
          sigmaInstance,
          {
            iterations: 500,
            easing: "quadraticInOut",
            duration: 800
          }
        );

        // Start the Fruchterman-Reingold algorithm:
        sigma.layouts.fruchtermanReingold.start(sigmaInstance);
        // Initialize the dragNodes plugin:
        dragListener = sigma.plugins.dragNodes(
          sigmaInstance,
          sigmaInstance.renderers[0],
          activeState
        );

        // Initialize the lasso plugin:
        lasso = new sigma.plugins.lasso(
          sigmaInstance,
          sigmaInstance.renderers[0],
          {
            strokeStyle: "rgb(100, 100, 200)",
            lineWidth: 2,
            fillWhileDrawing: true,
            fillStyle: "rgba(100, 100, 200, 0.1)",
            cursor: "crosshair"
          }
        );

        select.bindLasso(lasso);
        // lasso.activate();

        sigmaInstance.renderers[0].bind("render", function(e) {
          sigmaInstance.renderers[0].halo({
            nodes: activeState.nodes()
          });
        });

        // sigma.utils.zoomTo(sigmaInstance.camera, 0, 0, 0.02);

        // handler for "s" key: the lasso tool
        keyboard.bind("83", function() {
          if (lasso.isActive) {
            // console.log("lasso deactivated");
            lasso.deactivate();
          } else {
            // console.log("lasso activated");
            lasso.activate();
          }
        });

        // handler for "escape" key: reset selection
        keyboard.bind("27", function() {
          // console.log("selection reset");
          tooltips.close();
          activeState.dropNodes();
          sigmaInstance.refresh({ skipIndexation: true });
        });

        // handler for "d" key: delete node
        // TODO: update the quick filter on the source sheet! (exclude deleted node(s))
        keyboard.bind("68", function() {
          // console.log("delete node(s)");
          tooltips.close();
          var nodesToDrop = [];
          var _nodes = sigmaInstance.graph.nodes();
          // console.log(_nodes.length);
          for (var i = 0; i < _nodes.length; i++) {
            // console.log(_nodes[i]);
            if (_nodes[i].active) {
              nodesToDrop.push(_nodes[i].id);
            }
          }
          // console.log(nodesToDrop);
          nodesToDrop.forEach(function(n) {
            sigmaInstance.graph.dropNode(n);
          });
          sigmaInstance.refresh();
        });

        // handler for "space" key: rerun force algo
        keyboard.bind("32", function() {
          // console.log("rerun force");
          tooltips.close();
          sigma.layouts.fruchtermanReingold.start(sigmaInstance);
        });

        // sigmaInstance.bind("clickNode", function(e) {
        //   // console.log("click node");
        //   // console.log(e.data.node.id);
        //   var nodesArray = [];
        //   nodesArray.push("" + e.data.node.id);
        // //   detailWS.applyFilterAsync("Account A", nodesArray, "replace", false);
        // //   //   if (highlightActive) highlightNodes();
        // // });

        // handler for "r" key: re-render graph from scratch
        keyboard.bind("82", function() {
          // console.log("pressed r");
          inputWs.getSummaryDataAsync().then(updateGraph);
        });

        // Listen for selectedNodes event
        lasso.bind("selectedNodes", function(e) {
          setTimeout(function() {
            // console.log("lasso selectedNodes");
            // console.log(e);
            var nodesArray = [];
            e.data.forEach(function(d) {
              nodesArray.push("" + d.id);
            });
            //detailWS.applyFilterAsync("node1", nodesArray, "replace", false);
            lasso.deactivate();
            sigmaInstance.refresh({ skipIndexation: true });
          }, 0);
        });

        // Instanciate the tooltips plugin for node tooltips:
        tooltips = sigma.plugins.tooltips(
          sigmaInstance,
          sigmaInstance.renderers[0],
          {
            // tooltip config
            node: {
              // show: "overNode",
              // hide: "outNode",
              // cssClass: "sigma-tooltip",
              position: "top",
              autoadjust: true,
              // TODO: set template via dynamic input in UI settings
              template:
                '<div class="arrow"></div>' +
                ' <div class="sigma-tooltip-header">Account {{id}}</div>' +
                '  <div class="sigma-tooltip-body">' +
                "    <table>" +
                "      <tr><th>Type</th> <td>{{data.type}}</td></tr>" +
                "      <tr><th>Status</th> <td>{{data.status}}</td></tr>" +
                "      <tr><th>Opened in</th> <td>{{data.open_date}}</td></tr>" +
                "    </table>" +
                "  </div>" +
                '  <div class="sigma-tooltip-footer">Comments</div>',
              renderer: function(node, template) {
                return Mustache.render(template, node);
              }
            },
            edge: {
              // show: "overEdge",
              // hide: "outEdge",
              // cssClass: "sigma-tooltip",
              position: "top",
              autoadjust: true,
              // TODO: set template via dynamic input in UI settings
              template:
                '<div class="arrow"></div>' +
                ' <div class="sigma-tooltip-header">Transaction {{id}}</div>' +
                '  <div class="sigma-tooltip-body">' +
                "    <table>" +
                "      <tr><th>Type</th> <td>{{data.type}}</td></tr>" +
                "      <tr><th>Total Amount</th> <td>{{data.amount}}</td></tr>" +
                "      <tr><th>Latest Date</th> <td>{{data.latest_date}}</td></tr>" +
                "    </table>" +
                "  </div>" +
                '  <div class="sigma-tooltip-footer">Comments</div>',
              renderer: function(edge, template) {
                return Mustache.render(template, edge);
              }
            }
          }
        );
        tooltips.bind("shown", function(event) {
          // console.log("tooltip shown");
        });
        tooltips.bind("hidden", function(event) {
          // console.log("tooltip hidden");
        });
      }); // end of inputWs.getSummaryDataAsync().then(function(dataTable)
    } else {
      console.log("settings not set");
      // tableau.extensions.settings.set("sheet", "Graph Data Trx");
      // tableau.extensions.settings.set("source_node", "Account A");
      // tableau.extensions.settings.set("source_type", "Client Type A");
      // tableau.extensions.settings.set("target_node", "Account B");
      // tableau.extensions.settings.set("target_type", "Client Type B");
      // tableau.extensions.settings.saveAsync();
    }
  }

  function getGraphData(dataTable) {
    var g = {
      nodes: [],
      edges: []
    };
    let node1idx = getFieldIndex(dataTable, savedSourceNodeField);
    let node1typeidx = getFieldIndex(dataTable, savedSourceTypeField);
    let node2idx = getFieldIndex(dataTable, savedTargetNodeField);
    let node2typeidx = getFieldIndex(dataTable, savedTargetTypeField);
    let nodelist = [];
    let nodetypes = {};
    let edgelist = [];
    for (let i = 0; i < dataTable.data.length; i++) {
      let row = dataTable.data[i];
      nodelist.push(row[node1idx].value);
      nodelist.push(row[node2idx].value);
      nodetypes[row[node1idx].value] = row[node1typeidx].value;
      nodetypes[row[node2idx].value] = row[node2typeidx].value;
      edgelist.push([row[node1idx].value, row[node2idx].value, row]);
    }
    let icons = ["\uF19C", "\uF1AD", "\uF0B1", "\uF183", "\uF007", "\uF0D6"]; // TODO: default => settings
    let colors = ["#338", "#833", "#383", "#883", "#388", "#838"]; // TODO: default => settings
    let nodevalues = nodelist.filter(function(el, i, arr) {
      return arr.indexOf(el) === i;
    }); // generate unique values array
    for (let i = 0; i < nodevalues.length; i++)
      g.nodes.push({
        id: nodevalues[i],
        label: nodevalues[i],
        x: Math.random(), // TODO: idea: fixate and store the coordinate into settings (add a settings option)
        y: Math.random(),
        size: Math.random() * 2 + 1, // TODO
        color:
          colors[
            [
              "Bank",
              "Broker",
              "Corporate",
              "Employee",
              "Individual",
              "Internal Account"
            ].indexOf(nodetypes[nodevalues[i]]) // mapping from icons array, TODO
          ],
        // icon: {
        //   // TODO idea: make icons optional
        //   font: "FontAwesome",
        //   content:
        //     icons[
        //       [
        //         "Bank",
        //         "Broker",
        //         "Corporate",
        //         "Employee",
        //         "Individual",
        //         "Internal Account"
        //       ].indexOf(nodetypes[nodevalues[i]]) // mapping from icons array, TODO
        //     ],
        //   scale: 0.9, // icon is 90% of the node size
        //   color: "#fff" // foreground color (white)
        // },
        data: {
          type: nodetypes[nodevalues[i]],
          status: "Open",
          open_date: "Date"
        }
      });
    for (let i = 0; i < edgelist.length; i++)
      g.edges.push({
        id: "e" + i, // TODO
        label: "CHF " + Math.round(edgelist[i][2][4].value), // TODO
        source: edgelist[i][0],
        target: edgelist[i][1],
        size: 1,
        color: "rgba(10,20,30,0.35)", // TODO: settings
        type: "arrow", // arrow, curvedArrow, TODO: settings
        data: {
          // TODO: define dynamically
          type: edgelist[i][2][6].value,
          amount: "CHF " + edgelist[i][2][4].value,
          latest_date: edgelist[i][2][5].value
        }
      });
    return g;
  }

  function updateGraph(dataTable) {
    // console.log("updateGraph");
    if (sigmaInstance) {
      var g = getGraphData(dataTable);
      // sigmaInstance.graph.nodes = g.nodes;
      // sigmaInstance.graph.edges = g.edges;
      var nodes = sigmaInstance.graph.nodes();
      // console.log(nodes);
      sigmaInstance.graph.clear();
      nodes.forEach(function(node) {
        // console.log("looking for node");
        var targetnode = g.nodes.filter(function(el) {
          return el.id === node.id;
        });
        if (
          typeof targetnode === "object" &&
          typeof targetnode[0] === "object"
        ) {
          targetnode[0].x = node.x;
          targetnode[0].y = node.y;
          targetnode[0].size = node.size;
          targetnode[0]._replacedcoords = 1;
          // console.log("changed node attrs");
        }
      });
      var newNodes = false;
      g.nodes.forEach(function(el) {
        if (el._replacedcoords) {
          delete el._replacedcoords;
        } else {
          newNodes = true;
        }
      });
      // console.log(sigmaInstance.cameras[0]);
      sigmaInstance.graph.read(g);
      sigmaInstance.refresh();
      // console.log(sigmaInstance.cameras[0]);
      // sigmaInstance.cameras[0].goTo({ x: 0, y: 0, angle: 0, ratio: 1 });
      if (newNodes) {
        // console.log("new nodes update");
        sigma.layouts.fruchtermanReingold.start(sigmaInstance);
      }
    }
  } // end of function updateGraph(dataTable)

  function getSelectedSheet(worksheetName) {
    return tableau.extensions.dashboardContent.dashboard.worksheets.find(
      function(sheet) {
        return sheet.name === worksheetName;
      }
    );
  }

  function getFieldIndex(dataTable, fieldName) {
    return dataTable.columns.find(function(column) {
      return column.fieldName === fieldName;
    }).index;
  }

  function configure() {
    let popupUrl = window.location.origin + "/configure.html";
    console.log(popupUrl);
    tableau.extensions.ui
      .displayDialogAsync(popupUrl, "Payload Message", {
        height: 600,
        width: 500
      })
      .then(function(closePayLoad) {
        if (!tableau.extensions.settings.get("sheet")) {
          console.log("No worksheet selected");
        } else {
          console.log("Worksheet selected");
          //renderGraph(); // this is catched by the settings changed event
        }
      })
      .catch(function(error) {
        switch (error.errorCode) {
          case tableau.ErrorCodes.DialogClosedByUser:
            console.log("Dialog was closed by user");
            break;
          default:
            console.error(error.message);
        }
      });
  }
})();
