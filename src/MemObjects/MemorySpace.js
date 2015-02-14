define(function(require, exports, module)
{

    var Engine = require("famous/core/Engine");
    var Surface = require("famous/core/Surface");
    var Transform = require("famous/core/Transform");
    var Modifier = require("famous/core/Modifier");
    var Transitionable = require('famous/transitions/Transitionable');
    var Easing = require('famous/transitions/Easing');
    var RenderController = require("famous/views/RenderController");

    var DynamicDetailView = require('../DynamicDetailView');
    var StretchyLayout = require('../PositioningLayouts/StretchyLayout');
    var PositionableView = require("../PositioningLayouts/PositionableView");
    var ObjectFactory = require('../ObjectFactory');
    var SurfaceWrappingView = require('../PositioningLayouts/SurfaceWrappingView');
    var DynamicContainer = require('../PositioningLayouts/DynamicContainer');
    var BoxView = require('../PositioningLayouts/BoxView');

    var Utils = require('../Utils');


    var labelHeight = 30;

    function MemorySpace(options){
        DynamicContainer.call(this,options);

        this.memConfig = this.options.memConfig;
        this.setSize(this.options.size);
        _init.call(this);
    }

    MemorySpace.DEFAULT_OPTIONS = {
        position: [0,0,0],
        size: [100,600],
        minimumContainerSize: [0,0],
        memConfig:{
            startAddress: 0,
            addressWidth: 8,
            memSize: 0xFFFFFFFF
        }
    };

    MemorySpace.prototype= Object.create(DynamicContainer.prototype);
    MemorySpace.prototype.constructor = MemorySpace;

    function _init(){

        var size = this.size; //|| [100,730];

        var objectFactory = new ObjectFactory();
        var memConfig = this.memConfig;

        var pv1 = new BoxView({
            text: Utils.hexString(memConfig.startAddress,memConfig.addressWidth),
            size:[size[0],labelHeight]});
        this.addChild(pv1);


        var fillingSize = [size[0],size[1]-(labelHeight*2)];

        pv1 = new BoxView({
            position: [0,labelHeight,0],
            size:fillingSize
        });
        this.addChild(pv1);

        pv1 = new BoxView({
            text: Utils.hexString(memConfig.startAddress + memConfig.memSize, memConfig.addressWidth),
            position: [0,fillingSize[1],0],
            size: [size[0],labelHeight]
        });
        this.addChild(pv1);
    }

    module.exports = MemorySpace;

});