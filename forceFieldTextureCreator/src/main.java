import java.io.File;

public class main {
    public static void main(String[] args) {
        String inPath = ".\\input\\qInput1.png";
        String outPath = ".\\mediaOut\\qOutput1.png";
        ForceFieldGen ffg = new ForceFieldGen(new File(inPath));
        ffg.gen();
        ffg.save(new File(outPath));
    }
}
