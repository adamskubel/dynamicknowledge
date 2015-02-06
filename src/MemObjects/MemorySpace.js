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

    var Utils = require('../Utils');

    function MemorySpace(options){
        DynamicContainer.call(this,options);

        this.memConfig = this.options.memConfig;
        _init.call(this);
    }

    MemorySpace.DEFAULT_OPTIONS = {
        memConfig:{
            startAddress: 0,
            addressWidth: 8,
            memSize: 0xFFFFFFFF
        }
    };

    MemorySpace.prototype= Object.create(DynamicContainer.prototype);
    MemorySpace.prototype.constructor = MemorySpace;

    function _init(){

        var objectFactory = new ObjectFactory();
        var memConfig = this.memConfig;

        var pv1 = objectFactory.makeLabelView('0x' + Utils.hexString(memConfig.startAddress,memConfig.addressWidth));
        pv1.setSize([undefined,30]);
        this.addChild(pv1);

        pv1 = objectFactory.makeLabelView("");
        pv1.setPosition([0,30,0]);
        pv1.setSize([undefined,700]);
        this.addChild(pv1);

        pv1 = objectFactory.makeLabelView('0x' + Utils.hexString(memConfig.startAddress+memConfig.memSize,memConfig.addressWidth));
        pv1.setPosition([0,730,0]);
        pv1.setSize([undefined,30]);
        this.addChild(pv1);
    }

    module.exports = MemorySpace;

});