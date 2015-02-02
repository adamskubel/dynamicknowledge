define(function(require, exports, module) {

    var Engine = require("famous/core/Engine");
    var Transform = require("famous/core/Transform");
    var Modifier = require("famous/core/Modifier");
    var View = require('famous/core/View');

    var ObjectFactory = require('./ObjectFactory');

    var DynamicDetailView = require('./DynamicDetailView');
    var PageTableView = require('./PageTableView');
    var StretchyLayout = require('./PositioningLayouts/StretchyLayout');
	var SurfaceWrappingView = require('./PositioningLayouts/SurfaceWrappingView');
	var MemoryPagingView = require('./MemoryPagingView');

	var systemDescription = "Each process is allocated portions of the system's memory." +
		" The process is not aware of which portions of the physical memory it has been allocated. " +
		"The kernel provides the process normalized memory space, and the mapping of this normalized memory space " +
		"is handled by the kernel proper. The term for this normalized space is 'virtual memory'";

    function ProcessMemoryManager(options)
    {
        DynamicDetailView.call(this,options);

        this.process = this.options.process;
    }

    ProcessMemoryManager.prototype = Object.create(DynamicDetailView.prototype);
    ProcessMemoryManager.prototype.constructor = ProcessMemoryManager;


    ProcessMemoryManager.prototype.makeComplexView = function(){

		var rootLayout = new StretchyLayout({
			viewSpacing:[0,0],
			direction: 1
		});

		var textLayout = (new ObjectFactory()).makeTextSurface(systemDescription);
		var wrapSurface = new SurfaceWrappingView(textLayout,{size: [600,100]});

        var pageTable = new PageTableView({
            size: [200,120]
        });

        var systemLayout = new StretchyLayout({
            position: [0,0,0],
            viewSpacing: [10,10],
			origin:[0.5,0.5],
			align:[0.5,0.5]
        });

		var virtualMemory = new MemoryPagingView({pageCount: 8});

		systemLayout.addChild(virtualMemory,{weight:1});
		systemLayout.addChild(pageTable, {weight: 1});

		rootLayout.addChild(wrapSurface,{weight:2});
		rootLayout.addChild(systemLayout,{weight:2});


        rootLayout.requestLayout();
        return rootLayout;
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