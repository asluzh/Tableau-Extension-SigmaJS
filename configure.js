const settingsKey = "SigmaJS";

var func = {};

func.saveSettings = function(settings, callback) {
  tableau.extensions.settings.set(settingsKey, JSON.stringify(settings));
  tableau.extensions.settings.saveAsync().then(newSavedSettings => {
    callback(newSavedSettings);
  });
};

func.getSettings = function(callback) {
  if (tableau.extensions.settings.get(settingsKey)) {
    var settings = JSON.parse(tableau.extensions.settings.get(settingsKey));
    callback(settings);
  } else {
    callback({});
  }
};

func.currentConfig = function(callback) {
  var config = {};
  config.seenConfig = true;
  config.sheetIndex = parseInt($("#sourceSheetSelect").val());
  config.sourceIndex = parseInt($("#sourceNodeSelect").val());
  config.targetIndex = parseInt($("#targetNodeSelect").val());
  config.nodesColor = $("#nodesColor").val();
  config.edgesColor = $("#edgesColor").val();
  callback(config);
};

func.resetSettings = function() {
  var config = {};
  config.seenConfig = true;
  config.sheetIndex = 0;
  config.sourceIndex = 0;
  config.targetIndex = 0;
  config.nodesColor = "rgba(0, 0, 0, .5)";
  config.edgesColor = "rgba(0, 0, 0, .5)";
  func.saveSettings(config, function(settings) {
    console.log("Settings Reset");
    func.configureUI();
  });
};

func.initialize = function(callback) {
  const sourceNodeSelect = new mdc.select.MDCSelect(
    document.querySelector("#sourceNode")
  );
  const targetNodeSelect = new mdc.select.MDCSelect(
    document.querySelector("#targetNode")
  );
  var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  for (var i = 0; i < worksheets.length; i++) {
    var ws = worksheets[i];
    $("#sourceSheetSelect").append(
      `<option value="` + i + `">` + ws.name + `</option>`
    );
  }
  const sheetSelect = new mdc.select.MDCSelect(
    document.querySelector("#sourceSheet")
  );
  sheetSelect.listen("change", () => {
    func.currentConfig(function(config) {
      func.saveSettings(config, function(settings) {
        func.buildDimensionSelect(function() {});
      });
    });
  });
  callback();
};

func.buildDimensionSelect = function(callback) {
  func.currentConfig(function(config) {
    var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
    var sheet = worksheets[config.sheetIndex];
    sheet.getSummaryDataAsync({ ignoreSelection: true }).then(data => {
      var cols = data.columns;
      var valid = false;
      $("#sourceNodeSelect").html(
        '<option value="" disabled selected></option>'
      );
      for (let i = 0; i < cols.length; i++) {
        if (cols[i].dataType === "string" || true) {
          $("#sourceNodeSelect").append(
            `<option value="` + i + `">` + cols[i].fieldName + `</option>`
          );
          valid = true;
        }
      }
      if (valid) {
        document.querySelector("#sourceNode").MDCSelect.disabled = false;
        $("#sourceNodeSelect").removeAttr("disabled");
      } else {
        document.querySelector("#sourceNode").MDCSelect.disabled = true;
        $("#sourceNodeSelect").attr("disabled", true);
      }
      const sourceNodeSelect = new mdc.select.MDCSelect(
        document.querySelector("#sourceNode")
      );
      $("#targetNodeSelect").html(
        '<option value="" disabled selected></option>'
      );
      for (let i = 0; i < cols.length; i++) {
        if (cols[i].dataType === "string" || true) {
          $("#targetNodeSelect").append(
            `<option value="` + i + `">` + cols[i].fieldName + `</option>`
          );
          valid = true;
        }
      }
      if (valid) {
        document.querySelector("#targetNode").MDCSelect.disabled = false;
        $("#targetNodeSelect").removeAttr("disabled");
      } else {
        document.querySelector("#targetNode").MDCSelect.disabled = true;
        $("#targetNodeSelect").attr("disabled", true);
      }
      const targetNodeSelect = new mdc.select.MDCSelect(
        document.querySelector("#targetNode")
      );
      callback(data);
    });
  });
};

func.configureUI = function() {
  func.getSettings(function(settings) {
    if (settings.nodesColor) {
      $("#nodesColor").val(settings.nodesColor);
      $(".mdc-text-field__icon.nodes-color").css("color", settings.nodesColor);
    }
    if (settings.edgesColor) {
      $("#edgesColor").val(settings.edgesColor);
      $(".mdc-text-field__icon.edges-color").css("color", settings.edgesColor);
    }
    console.log(settings.sheetIndex);
    if (settings.sheetIndex >= 0) {
      $("#sourceSheetSelect").val(settings.sheetIndex);
      $("#sourceSheetSelect")
        .parent()
        .find("label")
        .addClass("mdc-floating-label--float-above");
      func.buildDimensionSelect(function(data) {
        if (settings.urlIndex >= 0) {
          document.querySelector("#sourceUrl").MDCSelect.disabled = false;
          $("#sourceUrlSelect").removeAttr("disabled");
          $("#sourceUrlSelect").val(settings.urlIndex);
          $("#sourceUrlSelect")
            .parent()
            .find("label")
            .addClass("mdc-floating-label--float-above");
          if (data.data[0][$("#sourceUrlSelect").val()].value) {
            $("#urlPreview").html(
              data.data[0][$("#sourceUrlSelect").val()].value
            );
          }
        }
      });
    }
  });
};

$(document).ready(function() {
  tableau.extensions.initializeDialogAsync().then(function(openPayload) {
    $(".resetBtn").click(func.resetSettings);

    $(".mdc-tab").click(function() {
      $(".mdc-tab").removeClass("mdc-tab--active");
      $(this).addClass("mdc-tab--active");
      $(".mdc-card").hide();
      $("." + $(this).attr("id") + "-card").show();
      //mdc.textField.MDCTextField.attachTo(document.querySelector('.mdc-text-field'));
    });
    func.initialize(function() {
      window.mdc.autoInit();
      func.configureUI();
    });
    const nodesColorField = new mdc.textField.MDCTextField(
      document.querySelector("#nodesColorField")
    );
    $(".nodes-color").materialColorPicker({
      mode: "modal",
      format: "rgba", // Format that allows transparency
      opacity: true, // Set to "true" to parse transparency
      onSelect: function(e) {
        if (e.currentcolor) {
          var color = e.currentcolor.color;
          $("#nodesColor").val(color);
          $(".mdc-text-field__icon.nodes-color").css("color", color);
          func.currentConfig(function(config) {
            func.saveSettings(config, function(settings) {
              console.log("Nodes color set");
            });
          });
        }
      }
    });
    const edgesColorField = new mdc.textField.MDCTextField(
      document.querySelector("#edgesColorField")
    );
    $(".edges-color").materialColorPicker({
      mode: "modal",
      format: "rgba", // Format that allows transparency
      opacity: true, // Set to "true" to parse transparency
      onSelect: function(e) {
        if (e.currentcolor) {
          var color = e.currentcolor.color;
          $("#edgesColor").val(color);
          $(".mdc-text-field__icon.edges-color").css("color", color);
          func.currentConfig(function(config) {
            func.saveSettings(config, function(settings) {
              console.log("Edges color set");
            });
          });
        }
      }
    });
    $("#nodesColor").on("keyup", function() {
      $(".mdc-text-field__icon.nodes-color").css(
        "color",
        $("#nodesColor").val()
      );
      func.currentConfig(function(config) {
        func.saveSettings(config, function(settings) {
          console.log("Nodes color set");
        });
      });
    });
    $("#edgesColor").on("keyup", function() {
      $(".mdc-text-field__icon.edges-color").css(
        "color",
        $("#edgesColor").val()
      );
      func.currentConfig(function(config) {
        func.saveSettings(config, function(settings) {
          console.log("Edges color set");
        });
      });
    });
  });
});
