using Microsoft.EntityFrameworkCore;
using QuizAPI.Models;

namespace QuizAPI;

public class DataContext : DbContext
{
    public DataContext(DbContextOptions<DataContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Quiz> Quizzes { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<QuizAttempt> QuizAttempts { get; set; }
    public DbSet<AttemptAnswer> AttemptAnswers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Users ──────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(u => u.Id);
            e.Property(u => u.Id).HasColumnName("Id").HasDefaultValueSql("gen_random_uuid()");
            e.Property(u => u.Name).HasColumnName("Name").HasMaxLength(100).IsRequired();
            e.Property(u => u.Email).HasColumnName("Email").HasMaxLength(200).IsRequired();
            e.Property(u => u.PasswordHash).HasColumnName("PasswordHash").IsRequired();
            e.Property(u => u.Role).HasColumnName("Role").HasMaxLength(20).HasDefaultValue("Student");
            e.Property(u => u.CreatedAt).HasColumnName("CreatedAt").HasDefaultValueSql("NOW()");
            e.HasIndex(u => u.Email).IsUnique().HasDatabaseName("UQ_Users_Email");
        });

        // ── Quizzes ───────────────────────────────────────────────────────
        modelBuilder.Entity<Quiz>(e =>
        {
            e.ToTable("Quizzes");
            e.HasKey(q => q.Id);
            e.Property(q => q.Id).HasColumnName("Id").HasDefaultValueSql("gen_random_uuid()");
            e.Property(q => q.Title).HasColumnName("Title").HasMaxLength(200).IsRequired();
            e.Property(q => q.Description).HasColumnName("Description").HasDefaultValue("");
            e.Property(q => q.TimeLimit).HasColumnName("TimeLimit").HasDefaultValue(30);
            e.Property(q => q.IsPublished).HasColumnName("IsPublished").HasDefaultValue(false);
            e.Property(q => q.CreatedById).HasColumnName("CreatedById");
            e.Property(q => q.CreatedAt).HasColumnName("CreatedAt").HasDefaultValueSql("NOW()");
            e.Property(q => q.StartTime).HasColumnName("StartTime").IsRequired(false);
            e.Property(q => q.EndTime).HasColumnName("EndTime").IsRequired(false);
            e.Property(q => q.PassingMarks).HasColumnName("PassingPercentage").HasDefaultValue(0);
            e.Property(q => q.AllowedStudentEmails).HasColumnName("AllowedStudentEmails").HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
            e.HasMany(q => q.Questions)
             .WithOne(q => q.Quiz)
             .HasForeignKey(q => q.QuizId)
             .HasConstraintName("FK_Questions_Quiz")
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Questions ─────────────────────────────────────────────────────
        modelBuilder.Entity<Question>(e =>
        {
            e.ToTable("Questions");
            e.HasKey(q => q.Id);
            e.Property(q => q.Id).HasColumnName("Id").HasDefaultValueSql("gen_random_uuid()");
            e.Property(q => q.QuizId).HasColumnName("QuizId");
            e.Property(q => q.Text).HasColumnName("Text").IsRequired();
            e.Property(q => q.Type).HasColumnName("Type").HasMaxLength(30).HasDefaultValue("MultipleChoice");
            e.Property(q => q.Options).HasColumnName("Options").HasColumnType("jsonb");
            e.Property(q => q.CorrectAnswer).HasColumnName("CorrectAnswer").IsRequired();
            e.Property(q => q.Points).HasColumnName("Points").HasDefaultValue(1);
            e.Property(q => q.OrderIndex).HasColumnName("OrderIndex").HasDefaultValue(0);
        });

        // ── QuizAttempts ──────────────────────────────────────────────────
        modelBuilder.Entity<QuizAttempt>(e =>
        {
            e.ToTable("QuizAttempts");
            e.HasKey(a => a.Id);
            e.Property(a => a.Id).HasColumnName("Id").HasDefaultValueSql("gen_random_uuid()");
            e.Property(a => a.QuizId).HasColumnName("QuizId");
            e.Property(a => a.UserId).HasColumnName("UserId");
            e.Property(a => a.Score).HasColumnName("Score").HasDefaultValue(0);
            e.Property(a => a.MaxScore).HasColumnName("MaxScore").HasDefaultValue(0);
            e.Property(a => a.StartedAt).HasColumnName("StartedAt").HasDefaultValueSql("NOW()");
            e.Property(a => a.CompletedAt).HasColumnName("CompletedAt").IsRequired(false);
            e.Property(a => a.IsCompleted).HasColumnName("IsCompleted").HasDefaultValue(false);
            e.HasMany(a => a.Answers)
             .WithOne(a => a.Attempt)
             .HasForeignKey(a => a.AttemptId)
             .HasConstraintName("FK_Answers_Attempt")
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Quiz)
             .WithMany()
             .HasForeignKey(a => a.QuizId)
             .HasConstraintName("FK_Attempts_Quiz")
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.User)
             .WithMany(u => u.Attempts)
             .HasForeignKey(a => a.UserId)
             .HasConstraintName("FK_Attempts_User")
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── AttemptAnswers ────────────────────────────────────────────────
        modelBuilder.Entity<AttemptAnswer>(e =>
        {
            e.ToTable("AttemptAnswers");
            e.HasKey(a => a.Id);
            e.Property(a => a.Id).HasColumnName("Id").HasDefaultValueSql("gen_random_uuid()");
            e.Property(a => a.AttemptId).HasColumnName("AttemptId");
            e.Property(a => a.QuestionId).HasColumnName("QuestionId");
            e.Property(a => a.Answer).HasColumnName("Answer").HasDefaultValue("");
            e.Property(a => a.IsCorrect).HasColumnName("IsCorrect").HasDefaultValue(false);
            e.Property(a => a.PointsEarned).HasColumnName("PointsEarned").HasDefaultValue(0);
            e.HasOne(a => a.Question)
             .WithMany()
             .HasForeignKey(a => a.QuestionId)
             .HasConstraintName("FK_Answers_Question")
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
