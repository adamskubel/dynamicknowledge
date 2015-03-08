define(function(require,exports,module){

    var BoxView = require('PositioningLayouts/BoxView');
    var SequenceView = require('PositioningLayouts/PSequenceView');

    function ListSelector(options)
    {
        BoxView.call(this,options);

        this.viewMap = {};
       _initView.call(this);
    }

    ListSelector.prototype = Object.create(BoxView.prototype);
    ListSelector.prototype.constructor = ListSelector;

    ListSelector.DEFAULT_OPTIONS = {
        clickable: true,
        scrollviewSizeHack: false,
        color:3500,
        text:"...",
        textAlign:[0.5,0.5],
        fontSize:'small',
        editable:false,
        rendercontrol:false,
        renderWhitespace:false,
        size:[20,20],
        useMarkdown:false
    };

    function _initView()
    {
        var listView = new SequenceView({
            direction:1,
            position:[0,10,5],
            viewAlign:[0,1],
            viewOrigin:[0,0]
        });

        this.add(listView.getModifier()).add(listView.getRenderController(true));

        this.listView = listView;

        this.on('click',_onClick.bind(this));
    }

    function _onClick()
    {
        this.listView.show();
    }

    ListSelector.prototype.setItems = function(items)
    {
        this.viewMap = {};
        this.listView.clearChildren();
        this.items = items;
        for (var i=0; i<items.length;i++)
        {
            var item = _addItem.call(this,items[i]);
            this.listView.addChild(item);
        }
        this.setSelectedItem(0);
    };


    ListSelector.prototype.getSelectedItem = function()
    {
        return this._selectedItem;
    };


    ListSelector.prototype.setSelectedItem = function(itemOrIndex)
    {
        if (itemOrIndex == undefined)
        {

        }
        else if (!isNaN(itemOrIndex))
        {
            _selectItem.call(this,this.items[itemOrIndex]);
        }
        else
        {
            _selectItem.call(this,itemOrIndex);
        }

    };

    function _addItem(item)
    {
        var itemView = new BoxView({
            size: this.options.size,
            clickable: true
        });

        itemView.setText(item);

        itemView.on('click',function(){
            _selectItem.call(this,item);
            this.listView.hide();
        }.bind(this));

        this.viewMap[item] = itemView;

        return itemView;
    }


    function _selectItem(item)
    {
        if (this.items.indexOf(item) < 0)
        {
            throw {"message" : "Not my item!"}
        }

        for (var itemKey in this.viewMap)
        {
            if (!this.viewMap.hasOwnProperty(itemKey)) continue;

            this.viewMap[itemKey].setHighlighted(itemKey == item);
        }
        this.setText(item);

        this._eventOutput.emit('itemSelected',{item:item});
        this._selectedItem = item;
    }


    module.exports = ListSelector;
});