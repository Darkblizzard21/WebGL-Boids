package util;

import java.awt.*;

import static java.lang.Math.cos;
import static java.lang.Math.sin;

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
        return toColor(1.0f);
    }
    public Color toColor(float b){
        Vec2 normalized = this.normalized();
        return new Color((float) (normalized.x * 0.5 + 0.5), (float) (normalized.y * 0.5 + 0.5), b);
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

    public Vec2 rotated(float degrees) {
        float rad = (float) Math.toRadians(degrees);
        double x = cos(rad)*this.x - sin(rad) * this.y;
        double y = sin(rad)*this.x + cos(rad) * this.y;
        return new Vec2(x, y);
    }


    public double length(){
        return Math.sqrt(x * x + y * y);
    }

    public double distanceTo(Vec2 other){
        return sub(other).length();
    }

    @Override
    public String toString() {
        return "Vec2{" +
                "x=" + x +
                ", y=" + y +
                '}';
    }
}
