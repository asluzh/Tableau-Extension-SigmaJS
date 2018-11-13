$(document).ready(function() {
  tableau.extensions.initializeAsync({ configure: configure }).then(function() {
    // define an empty graph
    const inputWs = tableau.extensions.dashboardContent.dashboard.worksheets.find(
      function(w) {
        return w.name.substr(0, 5) === "Graph";
      }
    );
    const detailWS = tableau.extensions.dashboardContent.dashboard.worksheets.find(
      function(w) {
        return w.name.substr(0, 12) === "Nodes Detail";
      }
    );
    var sigmaInstance;
    var getGraphData = function(dataTable) {
      var g = {
        nodes: [],
        edges: []
      };
      let node1idx = 0; //dataTable.columns.find(column => column.fieldName === "node1").index;
      let node2idx = 1; //dataTable.columns.find(column => column.fieldName === "node2").index;
      let nodelist = [];
      let edgelist = [];
      for (let i = 0; i < dataTable.data.length; i++) {
        let row = dataTable.data[i];
        nodelist.push(row[node1idx].value);
        nodelist.push(row[node2idx].value);
        edgelist.push([row[node1idx].value, row[node2idx].value, row[2].value]);
      }
      let icons = ["\uF1AD", "\uF007"]; // "\uF187", "\uF021"
      let colors = ["#338", "#833"];
      let nodevalues = nodelist.filter(function(el, i, arr) {
        return arr.indexOf(el) === i;
      }); // unique
      // console.log(nodevalues);
      for (let i = 0; i < nodevalues.length; i++)
        g.nodes.push({
          id: nodevalues[i],
          // label: nodevalues[i],
          x: Math.random(),
          y: Math.random(),
          size: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          icon: {
            font: "FontAwesome", // or 'FontAwesome' etc..
            content: icons[Math.floor(Math.random() * icons.length)], // or custom fontawesome code eg. "\uF129"
            scale: 0.9, // 70% of node size
            color: "#fff" // foreground color (white)
          },
          data: {
            name: "Jean",
            gender: "Male",
            age: 28,
            city: "Paris"
          }
        });
      for (let i = 0; i < edgelist.length; i++)
        g.edges.push({
          id: "e" + i,
          // label: "Amount: " + edgelist[i][2],
          source: edgelist[i][0],
          target: edgelist[i][1],
          size: edgelist[i][2], //Math.random() * 3 + 1,
          color: "rgba(10,20,30,0.35)",
          type: "arrow" // arrow, curvedArrow
        });
      return g;
    };

    inputWs.getSummaryDataAsync().then(function(dataTable) {
      var g = getGraphData(dataTable);
      // Instantiate sigma:
      // var cont = $("#graph-container");
      // cont.css("background-color", "yellow");
      $("#graph-container").empty();
      sigma.renderers.def = sigma.renderers.canvas;

      // sigma.classes.graph.addMethod("neighbors", function(nodeId) {
      //   var k,
      //     neighbors = {},
      //     index = this.allNeighborsIndex[nodeId] || {};

      //   for (k in index) neighbors[k] = this.nodesIndex[k];

      //   return neighbors;
      // });

      sigmaInstance = new sigma({
        graph: g,
        container: "graph-container", //document.getElementById("graph-container"), //
        settings: {
          sideMargin: 5,
          // scalingMode: "inside",
          minNodeSize: 3,
          maxNodeSize: 15,
          minEdgeSize: 1,
          maxEdgeSize: 3,
          // edgeLabelSize: "proportional",
          // minArrowSize: 1,
          // enableEdgeHovering: true,
          // edgeHoverSizeRatio: 2,
          edgeHoverExtremities: false, // also highlight nodes on edge hover
          drawLabels: false,
          // batchEdgesDrawing: true
          // labelHoverBGColor: "node"
          // labelThreshold: 25 // which zoom level is enough to display the labels
          borderSize: 1,
          outerBorderSize: 2,
          defaultNodeBorderColor: "#fff",
          defaultNodeOuterBorderColor: "rgb(100, 100, 200)",
          nodeHaloColor: "rgba(100, 100, 200, 0.2)",
          nodeHaloSize: 10
          // edgeHaloColor: "#ecf0f1",
          // edgeHaloSize: 10
          // drawGlyphs: true,
        }
      });
      var activeState = sigma.plugins.activeState(sigmaInstance);

      sigmaInstance.graph.nodes().forEach(function(n) {
        n.originalColor = n.color;
      });
      sigmaInstance.graph.edges().forEach(function(e) {
        e.originalColor = e.color;
      });

      // Instanciate the ActiveState plugin:
      // var activeState = sigma.plugins.activeState(sigmaInstance);
      var keyboard = sigma.plugins.keyboard(
        sigmaInstance,
        sigmaInstance.renderers[0]
      );

      // Initialize the Select plugin:
      var select = sigma.plugins.select(sigmaInstance, activeState);
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
      // $("#rearrange").addEventListener(
      //   "click",
      //   sigma.layouts.fruchtermanReingold.start(sigmaInstance)
      // );
      // Initialize the dragNodes plugin:
      var dragListener = sigma.plugins.dragNodes(
        sigmaInstance,
        sigmaInstance.renderers[0],
        activeState
      );

      // Initialize the lasso plugin:
      var lasso = new sigma.plugins.lasso(
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

      // handler for "s" key: the lasso tool
      keyboard.bind("83", function() {
        if (lasso.isActive) {
          console.log("lasso deactivated");
          lasso.deactivate();
        } else {
          console.log("lasso activated");
          lasso.activate();
        }
      });

      // handler for "x" key: reset selection
      keyboard.bind("88", function() {
        console.log("selection reset");
        activeState.dropNodes();
        sigmaInstance.refresh({ skipIndexation: true });
      });

      // handler for "d" key: delete node
      keyboard.bind("68", function() {
        console.log("delete node(s)");
        nodesToDrop = [];
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
        console.log("rerun force");
        sigma.layouts.fruchtermanReingold.start(sigmaInstance);
      });

      var highlightActive = false;
      var highlightNodes = function() {
        var _selectednodes = activeState.nodes();
        if (_selectednodes.length > 0 && !highlightActive) {
          // only highlight if at least one node is selected
          console.log("highlight neighbors");
          var _highlightnodes = [];
          var _highlightnodesid = [];
          _selectednodes.forEach(function(n) {
            // console.log(n.id);
            _highlightnodes.push(n);
            _highlightnodesid.push(n.id);
            sigmaInstance.graph.adjacentNodes(n.id).forEach(function(adj) {
              _highlightnodes.push(adj);
              _highlightnodesid.push(adj.id);
            });
          });
          sigmaInstance.graph.nodes().forEach(function(n) {
            if (_highlightnodes.indexOf(n) >= 0) n.color = n.originalColor;
            else n.color = "#ddd";
          });
          sigmaInstance.graph.edges().forEach(function(e) {
            // console.log(e.source);
            if (
              _highlightnodesid.indexOf(e.source) >= 0 &&
              _highlightnodesid.indexOf(e.target) >= 0
            )
              e.color = e.originalColor;
            else e.color = "#ddd";
          });
          // console.log(_highlightnodes);
          highlightActive = true;

          //   if (toKeep[e.source] && toKeep[e.target]) e.color = e.originalColor;
          //   else e.color = "#ddd";
          // });
        } else {
          sigmaInstance.graph.nodes().forEach(function(n) {
            n.color = n.originalColor;
          });
          sigmaInstance.graph.edges().forEach(function(e) {
            e.color = e.originalColor;
          });
          highlightActive = false;
        }
        // Since the data has been modified, we need to
        // call the refresh method to make the colors
        // update effective.
        sigmaInstance.refresh();
      };

      // handler for "h" key: highlight neighbors
      keyboard.bind("72", highlightNodes);
      // same for deactivate / reselect node
      sigmaInstance.bind("clickNode", function(e) {
        console.log("click node");
        // console.log(e.data.node.id);
        var nodesArray = [];
        nodesArray.push("" + e.data.node.id);
        detailWS.applyFilterAsync("node1", nodesArray, "replace", false);
        if (highlightActive) highlightNodes();
      });

      sigmaInstance.bind("selectedNodes", function(e) {
        console.log("selected nodes");
        if (highlightActive) highlightNodes();
      });

      // handler for "r" key: re-render graph from scratch
      keyboard.bind("82", function() {
        var g = getGraphData(dataTable);
        sigmaInstance.graph.clear();
        sigmaInstance.graph.read(g);
        sigmaInstance.refresh();
        sigma.layouts.fruchtermanReingold.start(sigmaInstance);
      });

      // Listen for selectedNodes event
      lasso.bind("selectedNodes", function(e) {
        setTimeout(function() {
          console.log("lasso selectedNodes");
          // console.log(e);
          var nodesArray = [];
          e.data.forEach(function(d) {
            nodesArray.push("" + d.id);
          });
          detailWS.applyFilterAsync("node1", nodesArray, "replace", false);
          lasso.deactivate();
          sigmaInstance.refresh({ skipIndexation: true });
        }, 0);
      });
    }); // end of inputWs.getSummaryDataAsync().then(function(dataTable)

    // // "highlight node" functionality, from sigmajs.org example
    // // We first need to save the original colors of our
    // // nodes and edges, like this:
    // sigmaInstance.graph.nodes().forEach(function(n) {
    //   n.originalColor = n.color;
    // });
    // sigmaInstance.graph.edges().forEach(function(e) {
    //   e.originalColor = e.color;
    // });

    // // When a node is clicked, we check for each node
    // // if it is a neighbor of the clicked one. If not,
    // // we set its color as grey, and else, it takes its
    // // original color.
    // // We do the same for the edges, and we only keep
    // // edges that have both extremities colored.
    // sigmaInstance.bind("clickNode", function(e) {
    //   console.log("Node clicked");
    //   if (e.data.node.active) {
    //     // run highlight only if node has been just activated (not on deactivate action)
    //     var nodeId = e.data.node.id;
    //     var toKeep = sigmaInstance.graph.neighbors(nodeId);
    //     toKeep[nodeId] = e.data.node;

    //     sigmaInstance.graph.nodes().forEach(function(n) {
    //       if (toKeep[n.id]) n.color = n.originalColor;
    //       else n.color = "#ddd";
    //     });

    //     sigmaInstance.graph.edges().forEach(function(e) {
    //       if (toKeep[e.source] && toKeep[e.target]) e.color = e.originalColor;
    //       else e.color = "#ddd";
    //     });
    //   } else {
    //     sigmaInstance.graph.nodes().forEach(function(n) {
    //       n.color = n.originalColor;
    //     });

    //     sigmaInstance.graph.edges().forEach(function(e) {
    //       e.color = e.originalColor;
    //     });
    //   }

    //   // Since the data has been modified, we need to
    //   // call the refresh method to make the colors
    //   // update effective.
    //   sigmaInstance.refresh();
    // });

    // sigmaInstance.bind("clickEdge", function(e) {
    //   console.log("Edge clicked");
    // });
    // // When the stage is clicked, we just color each
    // // node and edge with its original color.
    // sigmaInstance.bind("clickStage", function(e) {
    //   console.log("Empty space clicked");
    //   sigmaInstance.graph.nodes().forEach(function(n) {
    //     n.color = n.originalColor;
    //   });

    //   sigmaInstance.graph.edges().forEach(function(e) {
    //     e.color = e.originalColor;
    //   });

    //   // Same as in the previous event:
    //   sigmaInstance.refresh();
    // });
    // ///////////////////////////////////////////////////////////////////////////

    var updateGraph = function(dataTable) {
      // TBD
      // console.log(dataTable);
      if (sigmaInstance) {
        var g = getGraphData(dataTable);
        sigmaInstance.graph.clear();
        // sigmaInstance.graph.nodes = g.nodes;
        // sigmaInstance.graph.edges = g.edges;
        sigmaInstance.graph.read(g);
        sigmaInstance.refresh();
        sigma.layouts.fruchtermanReingold.start(sigmaInstance);
      }
    };
    inputWs.addEventListener(
      tableau.TableauEventType.FilterChanged,
      function() {
        console.log("FilterChanged");
        inputWs.getSummaryDataAsync().then(updateGraph);
      }
    );
    tableau.extensions.dashboardContent.dashboard
      .getParametersAsync()
      .then(function(parameters) {
        parameters.forEach(function(p) {
          if (p.name === "Max Node") {
            p.addEventListener(
              tableau.TableauEventType.ParameterChanged,
              function() {
                console.log("ParameterChanged");
                inputWs.getSummaryDataAsync().then(updateGraph);
              }
            );
          }
        });
      });
    // tableau.extensions.dashboardContent.dashboard.worksheets
    //   .find(w => w.name === "Summary Data")
    //   .getSummaryDataAsync()
    //   .then(dataTable => {
    //     for (let row of dataTable.data) {
    //       console.log(row);
    //     }
    //   });

    tableau.extensions.settings.addEventListener(
      tableau.TableauEventType.SettingsChanged,
      function(settingsEvent) {}
    );
  });
});

function configure() {
  const popupUrl = window.location.origin + "configure.html";
  tableau.extensions.ui
    .displayDialogAsync(popupUrl, "Payload Message", {
      height: 500,
      width: 500
    })
    .then(function(closePayload) {})
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
