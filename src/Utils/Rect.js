define(function(require,exports,module){

    var Vector = ('Utils/ProperVector');

    function Rect(x,y,width,height)
    {
        if (!isNaN(x))
        {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        if (x.x)
        {
            this.x = x.x;
            this.y = x.y;
            this.width = x.width;
            this.height = x.height;
        }
    }

    Rect.make = function(x,y,width,height)
    {
        if (x instanceof Array)
        {
            return new Rect(x[0],x[1],y[0],y[1]);
        }

        return new Rect({
            x : x,
            y : y,
            width : width,
            height : height
        });
    };

    Rect.makeCentered = function(x,y,width,height)
    {
        return Rect.make(x-(width/2),y-(height/2),width,height);
    };

    Rect.prototype.intersect = function(other)
    {
        return Rect.getRectIntersection(this,other);
    };

    Rect.prototype.getCenter = function()
    {
        return new Vector(this.x + (this.width/2),this.y + (this.height/2),0);
    };

    Rect.prototype.getBottomRight = function()
    {
        return new Vector(this.x + this.width, this.y+this.height,0);
    };


    Rect.getRectIntersection = function(a,b)
    {
        var x = Math.max(a.x, b.x);
        var num1 = Math.min(a.x + a.width, b.x + b.width);
        var y = Math.max(a.y, b.y);
        var num2 = Math.min(a.y + a.height, b.y + b.height);

        if (num1 >= x && num2 >= y)
            return Utils.getRect(x, y, num1 - x, num2 - y);
        else
            return null;
    };

});