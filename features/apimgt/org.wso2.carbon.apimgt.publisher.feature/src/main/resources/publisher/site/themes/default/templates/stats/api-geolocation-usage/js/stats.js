var currentLocation;
currentLocation = window.location.pathname;
var statsEnabled = isDataPublishingEnabled();
var apiNameVersionMap = {};
var apiName;
var width;
var height;
var padding_horizontal;
var padding_top;
var drilldown = "ALL";
var version = "ALL";
var ratio = 3/4;
var enableVersion = false; 
var d = new Date();
var currentDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(),d.getSeconds());
var to = new Date();
var from = new Date(to.getTime() - 1000 * 60 * 60 * 24);
$( document ).ready(function() {
   populateAPIList();
    width = $("#chartContainer").width();
    padding_horizontal = width/9;
    padding_top = width/3;
    height = width * ratio;
    $(window).resize(function() {
    width = $("#chartContainer").width();
    padding_horizontal = width/9;
    padding_top = width/3;
    height = width * ratio;
    renderGraph(from,to);        
    });
   $("#apiSelect").change(function (e) {
       apiName = this.value;
       populateVersionList(apiName,false);
    });
     $('#select-version').on('click', function () {
        enableVersion = true;
         populateVersionList(apiName,false);
       $("#divVersion").css('display','inline');
       $(this).hide();
    });
      $('#button-clear').on('click', function () {
       $("#divVersion").css('display','none');
       $("#select-version").css('display','inline');
       version="ALL";
       enableVersion = false;
       renderGraph(from,to);        
    });
    $("#versionSelect").change(function (e) {
      if (enableVersion) {
      version = this.value;        
      }
      renderGraph(from,to);        
    });
    $('#today-btn').on('click', function () {
      from = currentDay - 86400000;
      to = currentDay;
      renderGraph(from,to);
    });
       $('#week-btn').on('click', function () {
        from = currentDay - 604800000;
        to = currentDay;
        renderGraph(from,to);         
      });
       $('#month-btn').on('click', function () {
        from = currentDay - (604800000 * 4);
        to = currentDay;
        renderGraph(from,to);        
        });
        $('#date-range').click(function () {
         $(this).removeClass('active');
         }); 
                   //date picker
        $('#date-range').dateRangePicker(
          {
            startOfWeek: 'monday',
            separator: ' <b>to</b> ',
            format: 'YYYY-MM-DD',
            autoClose: false,
            time: {
                enabled: true
                  },
            shortcuts: 'hide',
             endDate: currentDay
          })
           .bind('datepicker-apply', function (event, obj) {
                 btnActiveToggle(this);
                 from = convertDate(obj.date1);
                 to = convertDate(obj.date2);
                 renderGraph(from, to);
                        });
});
var populateAPIList = function(){
           jagg.post("/site/blocks/stats/ajax/stats.jag", { action : "getAPIList" ,currentLocation:currentLocation},
        function (json) {
        if (!json.error) {
              apiNameVersionMap = json.apiNameVersionMap;
                var i=0;
                $('#apiSelect').empty();
                for (var name in apiNameVersionMap) {
                    if (i==0) {
                    $('#apiSelect').append('<option selected="selected" value'+name+'>' + name + '</option>');
                }else{
                    $('#apiSelect').append('<option value='+name+'>' + name+ '</option>');
                }
                i++;
            }
            $('#apiSelect').trigger('change');
            }
        });
};
var populateVersionList = function(apiName,compare){
        var i=0;
       $('#versionSelect').empty();
        for (var version in apiNameVersionMap[apiName]) {
            var tempVersion = apiNameVersionMap[apiName][version];
                    if (i==0) {
                    $('#versionSelect').append('<option selected="selected" value'+tempVersion+'>' + tempVersion + '</option>');
                }else{
                    $('#versionSelect').append('<option value='+tempVersion+'>' + tempVersion+ '</option>');
                }
                i++;
}
          $('#versionSelect').trigger('change');
        };

function isDataPublishingEnabled(){
    jagg.post("/site/blocks/stats/ajax/stats.jag", { action: "isDataPublishingEnabled"},
        function (json) {
            if (!json.error) {
                statsEnabled = json.usage;
                return statsEnabled;
            } else {
                if (json.message == "AuthenticateError") {
                    jagg.showLogin();
                } else {
                    jagg.message({content: json.message, type: "error"});
                }
            }
        }, "json");
}

var convertTimeString = function(date){
    var d = new Date(date);
    var formattedDate = d.getFullYear() + "-" + formatTimeChunk((d.getMonth()+1)) + "-" + formatTimeChunk(d.getDate())+" "+formatTimeChunk(d.getHours())+":"+formatTimeChunk(d.getMinutes())+":"+formatTimeChunk(d.getSeconds());
    return formattedDate;
};

var convertTimeStringPlusDay = function (date) {
    var d = new Date(date);
    var formattedDate = d.getFullYear() + "-" + formatTimeChunk((d.getMonth() + 1)) + "-" + formatTimeChunk(d.getDate() + 1);
    return formattedDate;
};

var formatTimeChunk = function (t) {
    if (t < 10) {
        t = "0" + t;
    }
    return t;
};

function convertDate(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour=date.getHours();
    var minute=date.getMinutes();
    return date.getFullYear() + '-' + (('' + month).length < 2 ? '0' : '')
        + month + '-' + (('' + day).length < 2 ? '0' : '') + day +" "+ (('' + hour).length < 2 ? '0' : '')
        + hour +":"+(('' + minute).length < 2 ? '0' : '')+ minute;
}

function btnActiveToggle(button){
    $(button).siblings().removeClass('active');
    $(button).addClass('active');
}
function renderGraph(fromDate,toDate){
   var to = convertTimeString(toDate);
    var from = convertTimeString(fromDate);
    var data = [];
           jagg.post("/site/blocks/stats/api-geolocation-usage/ajax/stats.jag", { action : "getGeolocationUsageByAPI" , apiName : apiName , apiVersion : version , fromDate : from , toDate : to,drilldown:drilldown},
        function (json) {
            if (!json.error) {

                if (json.usage && json.usage.length > 0) {
                  for(var usage1 in json.usage ){
                  var values = json.usage[usage1].values;
                  var count = values.count;
                  var country;
                  if (drilldown != "ALL") {
                   country = values.key_country_city_facet[1];
                  }else{
                   country = values.key_country_city_facet[0];
                  }
                  data.push([country,count]);
                  }
                    drawGraphInArea(data);
                }
                else if (json.usage && json.usage.length == 0 && statsEnabled) {
                    $('#temploadinglatencytTime').html('');
                    $('#temploadinglatencytTime').append($('<h3 class="no-data-heading center-wrapper">No Data Available</h3>'));
                    $('#chartContainer').hide();

                }
                else {
                    $('#middle').html("");
                    $('#middle').append($('<div class="errorWrapper"><span class="label top-level-warning"><i class="icon-warning-sign icon-white"></i>'
                        + i18n.t('errorMsgs.checkDASConnectivity') + '</span><br/><img src="../themes/default/templates/stats/api-last-access-times/images/statsThumb.png" alt="Smiley face"></div>'));
                }
            }
            else {
                if (json.message == "AuthenticateError") {
                    jagg.showLogin();
                } else {
                    jagg.message({content: json.message, type: "error"});
                }
            }
        }, "json");
}

function drawGraphInArea(rdata){
      $('#chartContainer').show();
      $('#chartContainer').empty()
      $('#temploadinglatencytTime').empty();
  var data =  [
        {
            "metadata" : {
                "names" : ["Country","Count"],
                "types" : ["ordinal", "linear"]
            },
            "data": rdata
        }
    ];
    var configWorld = {
        type: "map",
        x : "Country",
        renderer : "canvas",
        charts : [{type: "map",  y : "Count", mapType : "world"}],
        width: width,
        height: height,
        colorScale:["#99ccff","#193366"],
        color:["#f7f7f7"],
        padding: {"top": padding_top, "left": padding_horizontal, "bottom": padding_horizontal, "right": padding_horizontal}
    };
      var configUsa = {
        type: "map",
        x : "Country",
        renderer : "canvas",
        charts : [{type: "map",  y : "Count", mapType : "usa"}],
        width: width,
        height: height,
        colorScale:["#99ccff","#193366"],
        color:["#f7f7f7"],
        padding: {"top":padding_top, "left": padding_horizontal, "bottom": padding_horizontal, "right": padding_horizontal}
    };
    var callbackmethod = function(event, item) { 

        if (item != null) {
          var country = item.datum.zipped.unitName;
          if (country =="United States") {
            drilldown = "United States";
            renderGraph(from, to);
          }else{
            drilldown = "ALL";
            renderGraph(from, to);
          }
          }
          }
    var worlHelperInfoJsonUrl = $("#countryInfo").val();
    var worldGeoCodesUrl = $("#world").val();
    var usahelperJson = $("#usainfo").val();
    var usaGeocodeJson = $("#usa").val();
    var worldChart;
    if (drilldown == "ALL") {
        configWorld.helperUrl = worlHelperInfoJsonUrl;
        configWorld.geoCodesUrl = worldGeoCodesUrl;
        worldChart = new vizg(data, configWorld);
    }else{
        configUsa.helperUrl = usahelperJson;
        configUsa.geoCodesUrl = usaGeocodeJson;
        worldChart = new vizg(data, configUsa);
    }
    worldChart.draw("#chartContainer", [{type:"click", callback:callbackmethod}]);
    $('#chartContainer').show();
        };
