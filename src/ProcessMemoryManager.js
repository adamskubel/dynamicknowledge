define(function(require, exports, module) {

    var Engine = require("famous/core/Engine");
    var Transform = require("famous/core/Transform");
    var Modifier = require("famous/core/Modifier");
    var View = require('famous/core/View');

    var ObjectFactory = require('./ObjectFactory');

    var DynamicDetailView = require('./DynamicDetailView');
    var PageTableView = require('./old/PageTableView');
    var StretchyLayout = require('./PositioningLayouts/StretchyLayout');
	var SurfaceWrappingView = require('./PositioningLayouts/SurfaceWrappingView');
	var MemoryPagingView = require('./MemoryPagingView');

	var systemDescription = "The basis of Linux memory management is 'virtual memory'." +
        "Basically, it's a virtual memory space allocated to a process, that has some mapping to " +
        "actual memory. This mapping enables the kernel to optimize and secure the system's memory." +
        "The mappings from virtual to real are defined in the process's page table";

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
            size: [200,120],
			viewOrigin:[0,0.5]
        });

        var systemLayout = new StretchyLayout({
            position: [0,0,0],
            viewSpacing: [10,10]
        });

		var virtualMemory = new MemoryPagingView({pageCount: 8});

		systemLayout.addChild(virtualMemory,{weight:1, align: 'left'});
		systemLayout.addChild(pageTable, {weight: 1, align:'center'});

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