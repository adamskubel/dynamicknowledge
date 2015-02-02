define(function(require, exports, module)
{

	var Engine = require("famous/core/Engine");
	var Surface = require("famous/core/Surface");
	var Transform = require("famous/core/Transform");
	var Modifier = require("famous/core/Modifier");
	var MouseSync = require("famous/inputs/MouseSync");
	var Modifier = require("famous/core/Modifier");
	var View = require("famous/core/View");
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var RenderController = require("famous/views/RenderController");

	var PositionableView = require('./PositioningLayouts/PositionableView');
    var PositioningGridLayout = require('./PositioningLayouts/PositioningGridLayout');
	var SequentialLayout = require('famous/views/SequentialLayout');

	var ObjectFactory = require('./ObjectFactory');
	var DynamicDetailView = require('./DynamicDetailView');
	var ProcessMemoryManager = require('./ProcessMemoryManager');

    var StretchyLayout = require('./PositioningLayouts/StretchyLayout2D');

	var kswapd = require('./kswapd');

	function MemorySystemView(options)
	{
		DynamicDetailView.call(this, options);

		Engine.on('prerender',function(){
			if (DynamicDetailView.prototype.needsLayout.call(this))
			{
				var sizes = this.measure();
				this.layout(sizes.minimumSize);
			}
		}.bind(this));
	}

	MemorySystemView.prototype = Object.create(DynamicDetailView.prototype);
	MemorySystemView.prototype.constructor = MemorySystemView;

	MemorySystemView.prototype.makeSimpleView = function()
	{
		var box = DynamicDetailView.prototype.makeSimpleView.call(this);
		box.setText("Memory System");
		box.setSize([160,500]);
		return box;
	};

	MemorySystemView.prototype.makeComplexView = function()
	{
		var processes = this.options.processes;

		var rootView = 	new StretchyLayout({
            position:   [0,0,0],
            size:       [200,200],
            viewSpacing: [10,10],
			direction: 1
        });

		rootView.setOrigin([0.5,0.5]);
		rootView.setAlign([0.5,0.5]);

		for (var i=0;i<processes.length;i++)
		{
			var pmem = new ProcessMemoryManager({
                size:[80,40],
                process: processes[i]
            });

			rootView.addChild(pmem,{
                weight: 1
            });
		}

		return rootView;
	};

	module.exports = MemorySystemView;
});