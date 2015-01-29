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
	var ObjectFactory = require('./ObjectFactory');
	var DynamicDetailView = require('./DynamicDetailView');
	var ProcessMemoryManager = require('./PageTableView');

	var kswapd = require('./kswapd');

	function MemorySystemView(options)
	{
		DynamicDetailView.apply(this, arguments);
	}

	MemorySystemView.prototype = Object.create(DynamicDetailView.prototype);
	MemorySystemView.prototype.constructor = MemorySystemView;


	MemorySystemView.prototype.makeComplexView = function(processes)
	{
		var rootView = new View();


		for (var i=0;i<processes.length;i++)
		{
			var pmem = new ProcessMemoryManager();
			rootView.add(pmem);
		}

		rootView.add(new kswapd());

		return rootView;
	};

	module.exports = MemorySystemView;
});