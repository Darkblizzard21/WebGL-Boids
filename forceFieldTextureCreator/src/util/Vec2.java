package util;

import java.awt.*;

public class Vec2 {
    public double x;
    public double y;

    public Vec2(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public Vec2(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public Vec2(Color color){
        this.x = color.getRed() - 127.0;
        this.y = color.getBlue() - 127.0;
        normalize();
    }


    public Color toColor(){
        Vec2 normalized = this.normalized();
        return new Color((float) (normalized.x * 0.5 + 0.5), (float) (normalized.y * 0.5 + 0.5), 1.0f);
    }

    public Vec2 add(Vec2 other){
        return new Vec2(x + other.x, y + other.y);
    }

    public Vec2 sub(Vec2 other){
        return new Vec2(x - other.x, y - other.y);
    }

    public Vec2 through2Length(){
        double twoL = 2 * length();
        return new Vec2(x / twoL, y/twoL);
    }
    // not Pure
    public Vec2 normalize() {
        double length = length();
        x = x / length;
        y = y / length;

        return this;
    }

    public Vec2 normalized() {
        double length = length();
        return new Vec2(x / length,y / length);
    }

    public double length(){
        return Math.sqrt(x * x + y * y);
    }

    public double distanceTo(Vec2 other){
        return sub(other).length();
    }
}
