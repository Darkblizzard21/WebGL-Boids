package util;

import java.awt.*;
import java.util.Objects;

import static java.lang.Math.cos;
import static java.lang.Math.sin;

public class Vec2 {
    public double x;
    public double y;

    public static Vec2 Infinity(){
        return new Vec2(Double.POSITIVE_INFINITY, Double.POSITIVE_INFINITY);
    }

    public static Vec2 Zero(){
        return new Vec2(0, 0);
    }


    public Vec2(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public Vec2(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public Vec2(Color color) {
        this.x = color.getRed() - 127.0;
        this.y = color.getBlue() - 127.0;
        normalize();
    }


    public Color toColor() {
        return toColor(1.0f);
    }

    public Color toColor(float b) {
        Vec2 normalized = this.normalized();
        return new Color((float) (normalized.x * 0.5 + 0.5), (float) (normalized.y * 0.5 + 0.5), b);
    }

    public int toRGB(){
        return toRGB(255);
    }

    public int toRGB(int b){
        Vec2 normalized = this.normalized();
        int r = MMath.clamp((int) ((normalized.x * 0.5 + 0.5 )*256), 0,255);
        int g = MMath.clamp((int) ((normalized.y * 0.5 + 0.5 )*256), 0,255);
        b = MMath.clamp(b,0,255);
        return (255 << 24) + (r << 16) + (g << 8) + b;
    }

    public Vec2 add(Vec2 other) {
        return new Vec2(x + other.x, y + other.y);
    }

    public Vec2 sub(Vec2 other) {
        return new Vec2(x - other.x, y - other.y);
    }

    public Vec2 scale(double s){
        return new Vec2(x * s, y * s);
    }

    public double dot(Vec2 other){
        return x * other.x + y * other.y;
    }

    public Vec2 through2Length() {
        double twoL = 2 * length();
        return new Vec2(x / twoL, y / twoL);
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
        return new Vec2(x / length, y / length);
    }

    public double angleTo(Vec2 other){
        double dividend = dot(other);
        double divisor = length()*other.length();
        return Math.toDegrees(Math.acos(dividend/divisor));
    }

    public Vec2 rotated(float degrees) {
        float rad = (float) Math.toRadians(degrees);
        double x = cos(rad) * this.x - sin(rad) * this.y;
        double y = sin(rad) * this.x + cos(rad) * this.y;
        return new Vec2(x, y);
    }

    public Vec2 round(){
        x = Math.round(x);
        y = Math.round(y);
        return this;
    }

    public Vec2 rounded(){
     return new Vec2(Math.round(x),Math.round(y));
    }

    public double length() {
        return Math.sqrt(x * x + y * y);
    }

    public double lengthTo(Vec2 other) {
        double abx = x - other.x;
        double aby = y - other.y;
        return Math.sqrt(abx * abx + aby * aby);
    }

    public double lengthTo(double x, double y) {
        double abx = this.x - x;
        double aby = this.y - y;
        return Math.sqrt(abx * abx + aby * aby);
    }

    public double distanceTo(Vec2 other) {
        return sub(other).length();
    }

    public boolean isFinite() {
        return Double.isFinite(x) && Double.isFinite(y);
    }

    @Override
    public String toString() {
        return "Vec2{" +
                "x=" + x +
                ", y=" + y +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Vec2 vec2 = (Vec2) o;
        return Double.compare(vec2.x, x) == 0 && Double.compare(vec2.y, y) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }
}
