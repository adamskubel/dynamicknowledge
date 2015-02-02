define(function(require, exports, module) {

    var Engine = require("famous/core/Engine");
    var Transform = require("famous/core/Transform");
    var Modifier = require("famous/core/Modifier");
    var View = require('famous/core/View');

    var ObjectFactory = require('./ObjectFactory');

    var DynamicDetailView = require('./DynamicDetailView');
    var PageTableView = require('./PageTableView');
    var StretchyLayout = require('./PositioningLayouts/StretchyLayout2D');

    //var PositioningGridLayout = require('./PositioningLayouts/PositioningGridLayout');

    function ProcessMemoryManager(options)
    {
        DynamicDetailView.call(this,options);

        this.process = this.options.process;
    }

    ProcessMemoryManager.prototype = Object.create(DynamicDetailView.prototype);
    ProcessMemoryManager.prototype.constructor = ProcessMemoryManager;


    ProcessMemoryManager.prototype.makeComplexView = function(){
        var pageTable = new PageTableView({
            size: [200,120]
        });

        var layout = new StretchyLayout({
            position: [0,0,0],
            viewSpacing: [10,10]
        });


		layout.setOrigin([0.5,0.5]);
		layout.setAlign([0.5,0.5]);

        layout.addChild(pageTable, {
            weight: 1
        });

        layout.requestLayout();
        return layout;
    };

    ProcessMemoryManager.prototype.makeSimpleView = function()
	{
		var box = DynamicDetailView.prototype.makeSimpleView.call(this);
		box.setText("mem_" + this.options.process.name);
		box.setSize([160,80]);
		return box;
	};


    module.exports = ProcessMemoryManager;
});