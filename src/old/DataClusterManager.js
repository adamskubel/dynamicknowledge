
define(function(require, exports, module) {
    var OptionsManager = require('famous/core/OptionsManager');
	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
    var StateModifier   = require("famous/modifiers/StateModifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var ObjectFactory = require('./../ObjectFactory');
	
    function DataClusterManager(options,context) {

		// this.options = Object.create(DataClusterManager.DEFAULT_OPTIONS);
  //       this.optionsManager = new OptionsManager(this.options);
  //       if (options) this.setOptions(options);


        this.cachedSize = [undefined, undefined];

         this.containerClusters = {};

        this.context = context;

    }

    DataClusterManager.prototype.constructor = DataClusterManager;


    DataClusterManager.DEFAULT_OPTIONS = {
        count: 10
    };

    DataClusterManager.prototype._moveDataToContainer = function(data,name,address)
    {
        // console.log('Name: ' + name + ", Address:" + address);
        var container = this.containerClusters[name][address];
        if (container != undefined)
        {
            var position = container.calculatePosition();
            
            var containerSize = container.calculateSize();
            var dataSize = data.objSize;


            if (dataSize == undefined)
            {
                data.updateSize(containerSize);
            }   
            else 
            {
                var dataSizeAspect = dataSize[0]/dataSize[1];
                var containerSizeAspect = containerSize[0]/containerSize[1];

                if ((dataSizeAspect > 1 && containerSizeAspect > 1) || (dataSizeAspect < 1 && containerSizeAspect < 1))
                {
                    data.updateSize(containerSize);
                    data.setRotation(0);
                    data.setPosition(position);
                }
                else 
                {
                    data.setRotation(Math.PI/2);
                    data.updateSize([containerSize[1],containerSize[0]]);
                    data.setPosition([position[0]+containerSize[0],position[1]]);
                }
            }
        }
        else
        {
            console.log("Container[" + name + "][" + address + "] is undefined");
        }
    };


    DataClusterManager.prototype.addContainerCluster = function(name,containerCluster){

        for (var i=0;i<containerCluster.length;i++)
        {
            var address = containerCluster[i].address;   
            if (address == undefined)
            {
                address = i;
                containerCluster[i].address = address;
            }
            containerCluster[i].containerName = name;
            if (this.containerClusters[name] == undefined)
                this.containerClusters[name] = {};
            this.containerClusters[name][address] = containerCluster[i];
        }

    };


    function _instrumentData(data)
    {
        var cluster = this;
        var transition = {duration: 400, curve: Easing.outQuad};
        data.setContainer = function(name,address){                                
            if (!this.moving)
            {
                this.containerName = name;
                this.containerAddress = address;
                cluster._moveDataToContainer(this,name,address);
            }
        };

        data.positionMod = new StateModifier({ transform:Transform.translate(10,20,0)});
        data.rotationMod = new StateModifier({ transform:Transform.rotateZ(0)});         
        data.sizeMod = new StateModifier({size:[20,5]});   

        data.setPosition = function(p){
            this.position = p;
            var me = this;
            this.moving = true;
            this.positionMod.setTransform(Transform.translate(p[0],p[1],5), transition, function(){me.moving = false});
        };

        data.setRotation = function(angle){
            this.moving = true;
            var me = this;
            this.rotationMod.setTransform(Transform.rotateZ(angle),transition, function(){me.moving = false});
        };

        data.updateSize = function(size){
            this.objSize = size;
            var me =  this;
            this.moving = true;
            this.sizeMod.setSize(size,transition, function(){me.moving = false});
        };
        data.objSize = [20,5];

        if (data.containerName != undefined && data.containerAddress != undefined)
        {
            data.setContainer(data.containerName,data.containerAddress);
        }
    }

    DataClusterManager.prototype.addDataCluster = function(dataCluster){

        for (var i=0;i<dataCluster.length;i++)
        {
            var data = dataCluster[i];
            
            _instrumentData.call(this,data);
            this.context.add(data.sizeMod).add(data.positionMod).add(data.rotationMod).add(data);
        }

    };


    module.exports = DataClusterManager;
});
























