define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var Modifier   = require("famous/core/Modifier");
	var View   = require("famous/core/View");
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
    var RenderController = require("famous/views/RenderController");

	var PositionableView = require('./PositioningLayouts/PositionableView');
	var PositioningGridLayout = require('./PositioningLayouts/PositioningGridLayout');
	var ObjectFactory = require('./ObjectFactory');
	
	function MemoryBlockView(options) 
	{
		PositionableView.apply(this, arguments);

		this.minAddress = options.startAddress;
		this.maxAddress = this.minAddress + options.memSize;
		this.responsive = options.responsive;
		this.setSize([50,options.memSize*18]);

        this.isPageOnly = options.isPageOnly;

		_makeMemoryBlock.call(this);
	}

	function _makeMemoryBlock()
	{
        var cell = (new ObjectFactory()).makeSurface("",'outline');
        cell.renderController = new RenderController();
        this.add(cell.renderController);
        this.pageOnlyCell = cell;

        if (!this.isPageOnly) {
            var grid = _makeGridLayout.call(this);

            grid.renderController = new RenderController();
            grid.owner = this;
            this.grid = grid;

            this.add(grid.renderController);
            grid.renderController.show(grid);

            this._eventInput.on('mem_access', function (data) {
                if (!(data.sender instanceof MemoryBlockView))
                    this.access(data.address, data);
            }).bindThis(this);
        }
        else
        {
            cell.renderController.show(cell);
        }
	}

	MemoryBlockView.prototype = Object.create(PositionableView.prototype);
	MemoryBlockView.prototype.constructor = MemoryBlockView;

	MemoryBlockView.prototype.setMemSize = function(memSize) {
		this.memSize = memSize;
		this.size = [50,this.memSize*18];
		this.modifier.setSize(this.size,{duration:100, curve:Easing.outQuad});
	};


    MemoryBlockView.prototype.setPageOnly = function(pageOnly)
    {
        this.isPageOnly = pageOnly;
        if (pageOnly)
        {
            if (this.grid)
                this.grid.renderController.hide();

            this.pageOnlyCell.renderController.show(this.pageOnlyCell);
        }
        else {

        }
    };
	
	MemoryBlockView.prototype.access = function access(offset,data) {

        var incomingPoint,outgoingPoint;
        if (this.isPageOnly)
        {
            incomingPoint = [this.calculatePosition()[0],this.calculatePosition()[1] + this.calculateSize()[1]*((offset - this.minAddress)/this.memSize)];
            outgoingPoint = [incomingPoint[0]+this.calculateSize()[0],incomingPoint[1]];
        }
        else
        {
            var memBlock = this.grid.views[offset - this.minAddress];
            if (memBlock == undefined)
                return;

            if (data.process != undefined) {
                if (memBlock.accesser != undefined && memBlock.accesser != data.process) {

                }
                else
                    memBlock.accesser = data.process;
            }

            memBlock.access();
            incomingPoint = this.grid.views[offset - this.minAddress].calculatePosition();
            outgoingPoint = [incomingPoint[0] + memBlock.calculateSize()[0], incomingPoint[1]];
        }

        data.sender = this;
        data.callstack.push(incomingPoint);
        data.callstack.push(outgoingPoint);

        this._eventOutput.emit('mem_access', data);
	};

	function _createCellView(i)
	{
		var myView = new View();
		var hexString = '';// '0x' + (this.minAddress + i).toString(16);
		var surface = (new ObjectFactory()).makeSurface(hexString);

		var state = new Transitionable(0.5);
		surface.opacityMod  = new Modifier({
			opacity: function(){
				return  state.get();
			}, 
			transform: function() {
				return Transform.translate(0,0,20*state.get());
			}
		});

		myView
			.add(surface.opacityMod)
			.add(surface);

		myView.surface = surface;

		myView.access = function()
		{
			if(state.isActive()) 
				state.halt();

			state.set(1,{duration: 50, curve: Easing.outQuad},
				function() {
					state.set(0.5,{ duration: 400, curve: Easing.outExpo });
				}
			);
		}
		myView.calculatePosition = function(){
			return this.owner.calculateChildPosition(this);
		};
		myView.calculateSize = function(){
			return this.owner.calculateChildSize(this);
		};

		if (this.responsive)
		{
			var blockView = this;
			surface.on('mouseenter',function(eventData){
				myView.access();
				var fromPos = myView.calculatePosition();
				fromPos[0] += blockView.calculateSize()[0];
				var data = {address:blockView.minAddress+i, callstack:blockView.createCallstack()};

				data.callstack.push(fromPos);
				blockView._eventOutput.emit('mem_access',data);
			});
		} 

		return myView;
	}

	function _makeGridLayout()
	{
		var count = this.maxAddress - this.minAddress;
		var sync = new MouseSync();
		var grid = new PositioningGridLayout({dimensions: [1,count]});
		grid.dimensions = [1,count];
		var views = [];
		grid.sequenceFrom(views);
		for (var i=0;i<count;i++)
		{
			var myView = _createCellView.call(this,i);
			views.push(myView);
			myView.owner = grid;
			myView.positionIndex = i;
			myView.surface.pipe(sync);		
		}
		grid.views = views;
		grid.mouseSync = sync;	
		this.cells = views;


		return grid;
	}
	module.exports = MemoryBlockView;
});






































