define(function(require, exports, module)
{
	var DynamicDetailView = require('./DynamicDetailView');
	var ProcessMemoryManager = require('./ProcessMemoryManager');
    var StretchyLayout = require('./PositioningLayouts/StretchyLayout');
	var kswapd = require('./kswapd');

	function MemorySystemView(options)
	{
		DynamicDetailView.call(this, options);

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